const crypto = require('crypto');

const { ApiKey, ApiKeyRequest, User } = require('../../database');
const { publicSiteUrl, adminSiteUrl } = require('../../config/env');
const logger = require('../../config/logger');
const emailService = require('../../shared/utils/emailService');
const secretBox = require('../../shared/utils/secretBox');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS, ROLES } = require('../../shared/constants');

/**
 * Couche service du module ApiKey.
 * Responsabilité :
 *  - clés d'API des applications tierces (module Integration) : génération,
 *    liste, révocation, suppression, vérification d'une clé entrante
 *    (`authenticate`, utilisé par middlewares/apiKeyGuard.js) ;
 *  - ré-affichage d'une clé (`reveal`) : réservé aux ADMIN et au
 *    propriétaire de la clé (`ownerUserId`) — personne d'autre ;
 *  - demandes de clé faites depuis le site public par un utilisateur
 *    connecté, approuvées (clé générée et attribuée au demandeur) ou
 *    refusées par un ADMIN, avec notification par email.
 */

const KEY_PREFIX = 'shk_';
const DISPLAY_PREFIX_LENGTH = 12;
// Au plus une écriture "dernière utilisation" par minute et par clé :
// évite une requête UPDATE à chaque appel d'une application très active.
const LAST_USED_THROTTLE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function generateKey() {
  return `${KEY_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
}

function status(apiKey) {
  if (apiKey.revokedAt) return 'revoked';
  if (apiKey.expiresAt && apiKey.expiresAt <= new Date()) return 'expired';
  return 'active';
}

function userRef(user) {
  return user ? { id: user.id, name: `${user.firstName} ${user.lastName}`.trim(), email: user.email } : null;
}

function toDto(apiKey) {
  return {
    id: apiKey.id,
    name: apiKey.name,
    description: apiKey.description,
    keyPrefix: apiKey.keyPrefix,
    status: status(apiKey),
    revealable: Boolean(apiKey.keyEncrypted),
    createdAt: apiKey.createdAt,
    createdBy: userRef(apiKey.createdBy),
    owner: userRef(apiKey.owner),
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    lastUsedAt: apiKey.lastUsedAt,
    lastUsedIp: apiKey.lastUsedIp,
  };
}

const USER_ATTRIBUTES = ['id', 'firstName', 'lastName', 'email'];
const KEY_INCLUDES = [
  { model: User, as: 'createdBy', attributes: USER_ATTRIBUTES },
  { model: User, as: 'owner', attributes: USER_ATTRIBUTES },
];

// --- Clés ---------------------------------------------------------------

async function list() {
  const apiKeys = await ApiKey.findAll({ include: KEY_INCLUDES, order: [['createdAt', 'DESC']] });
  return apiKeys.map(toDto);
}

async function findOrFail(id) {
  const apiKey = await ApiKey.findByPk(id, { include: KEY_INCLUDES });
  if (!apiKey) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Clé d'API introuvable");
  }
  return apiKey;
}

// Génère une clé et l'enregistre (empreinte + copie chiffrée). Renvoie la
// clé en clair à l'appelant, qui décide de l'afficher ou non.
async function generate({ name, description, expiresAt, createdById, ownerUserId }, options = {}) {
  const key = generateKey();
  const apiKey = await ApiKey.create(
    {
      name,
      description: description || null,
      keyPrefix: key.slice(0, DISPLAY_PREFIX_LENGTH),
      keyHash: hashKey(key),
      keyEncrypted: secretBox.encrypt(key),
      createdById: createdById ?? null,
      ownerUserId: ownerUserId ?? null,
      expiresAt: expiresAt ?? null,
    },
    options
  );
  return { apiKey, key };
}

async function create({ name, description, expiresAt, ownerUserId }, userId) {
  if (ownerUserId) {
    const owner = await User.findByPk(ownerUserId);
    if (!owner) throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Utilisateur propriétaire introuvable');
  }

  const { apiKey, key } = await generate({ name, description, expiresAt, createdById: userId, ownerUserId });
  const created = await findOrFail(apiKey.id);
  return { apiKey: toDto(created), key };
}

// Clés attribuées à un utilisateur (page « Mes clés d'API » du site public).
async function listMine(userId) {
  const apiKeys = await ApiKey.findAll({
    where: { ownerUserId: userId },
    include: KEY_INCLUDES,
    order: [['createdAt', 'DESC']],
  });
  return apiKeys.map(toDto);
}

/**
 * Ré-affiche une clé en clair — uniquement pour un ADMIN ou pour le
 * propriétaire de la clé. Toute autre personne reçoit 404 (on ne révèle
 * pas l'existence de la clé). Chaque affichage est journalisé.
 */
async function reveal(id, user) {
  const apiKey = await findOrFail(id);
  const isAdmin = user?.role === ROLES.ADMIN;
  const isOwner = apiKey.ownerUserId !== null && apiKey.ownerUserId === user?.id;

  if (!isAdmin && !isOwner) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Clé d'API introuvable");
  }
  if (!apiKey.keyEncrypted) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Cette clé a été créée avant l'activation du ré-affichage : elle ne peut pas être affichée. Générez-en une nouvelle si nécessaire."
    );
  }

  let key;
  try {
    key = secretBox.decrypt(apiKey.keyEncrypted);
  } catch {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      'Impossible de déchiffrer cette clé (secret de chiffrement modifié). Générez-en une nouvelle.'
    );
  }

  logger.info(`Clé d'API #${apiKey.id} (${apiKey.name}) affichée par l'utilisateur #${user.id} (${user.role})`);
  return { apiKey: toDto(apiKey), key };
}

async function revoke(id) {
  const apiKey = await findOrFail(id);
  if (!apiKey.revokedAt) {
    await apiKey.update({ revokedAt: new Date() });
  }
  return toDto(apiKey);
}

async function remove(id) {
  const apiKey = await findOrFail(id);
  await apiKey.destroy();
}

/**
 * Vérifie une clé présentée par une application tierce. Recherche par
 * empreinte (index unique) : la clé en clair n'est jamais comparée ni
 * stockée en clair. Renvoie la clé si elle est active, `null` sinon.
 */
async function authenticate(key, ip) {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;

  const apiKey = await ApiKey.findOne({ where: { keyHash: hashKey(key) } });
  if (!apiKey || status(apiKey) !== 'active') return null;

  const now = new Date();
  if (!apiKey.lastUsedAt || now - apiKey.lastUsedAt > LAST_USED_THROTTLE_MS) {
    apiKey.update({ lastUsedAt: now, lastUsedIp: ip ? String(ip).slice(0, 45) : null }).catch(() => undefined);
  }

  return apiKey;
}

// --- Demandes -----------------------------------------------------------

const REQUEST_INCLUDES = [
  { model: User, as: 'requester', attributes: USER_ATTRIBUTES },
  { model: User, as: 'reviewedBy', attributes: USER_ATTRIBUTES },
  { model: ApiKey, as: 'apiKey', include: KEY_INCLUDES },
];

function toRequestDto(request) {
  return {
    id: request.id,
    applicationName: request.applicationName,
    usageDescription: request.usageDescription,
    validityDays: request.validityDays,
    status: request.status,
    createdAt: request.createdAt,
    requester: userRef(request.requester),
    reviewedBy: userRef(request.reviewedBy),
    reviewedAt: request.reviewedAt,
    rejectionReason: request.rejectionReason,
    apiKey: request.apiKey ? toDto(request.apiKey) : null,
  };
}

async function findRequestOrFail(id) {
  const request = await ApiKeyRequest.findByPk(id, { include: REQUEST_INCLUDES });
  if (!request) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Demande introuvable');
  }
  return request;
}

function notify(promise, description) {
  promise
    .then(() => logger.info(`Email envoyé : ${description}`))
    .catch((error) => logger.error(`Échec de l'envoi de l'email (${description}) : ${error.message}`));
}

async function createRequest({ applicationName, usageDescription, validityDays }, userId) {
  const requester = await User.findByPk(userId, { attributes: USER_ATTRIBUTES });
  if (!requester) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Utilisateur introuvable');
  }

  const pendingCount = await ApiKeyRequest.count({ where: { requesterId: userId, status: 'pending' } });
  if (pendingCount >= 5) {
    throw new ApiError(
      HTTP_STATUS.CONFLICT,
      "Vous avez déjà 5 demandes en attente : patientez jusqu'à leur traitement avant d'en faire une nouvelle."
    );
  }

  const request = await ApiKeyRequest.create({
    requesterId: userId,
    applicationName,
    usageDescription,
    validityDays: validityDays ?? null,
  });

  const admins = await User.findAll({ where: { role: ROLES.ADMIN, isActive: true }, attributes: ['email'] });
  if (admins.length > 0) {
    notify(
      emailService.sendApiKeyRequestedEmail({
        to: admins.map((admin) => admin.email).join(', '),
        requesterName: `${requester.firstName} ${requester.lastName}`.trim(),
        requesterEmail: requester.email,
        applicationName,
        usageDescription,
        adminUrl: adminSiteUrl,
      }),
      `nouvelle demande de clé #${request.id} aux administrateurs`
    );
  }

  return toRequestDto(await findRequestOrFail(request.id));
}

async function listRequests({ status: statusFilter } = {}) {
  const requests = await ApiKeyRequest.findAll({
    where: statusFilter ? { status: statusFilter } : {},
    include: REQUEST_INCLUDES,
    order: [['createdAt', 'DESC']],
  });
  return requests.map(toRequestDto);
}

async function listMyRequests(userId) {
  const requests = await ApiKeyRequest.findAll({
    where: { requesterId: userId },
    include: REQUEST_INCLUDES,
    order: [['createdAt', 'DESC']],
  });
  return requests.map(toRequestDto);
}

async function cancelRequest(id, userId) {
  const request = await findRequestOrFail(id);
  if (request.requesterId !== userId) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Demande introuvable');
  }
  if (request.status !== 'pending') {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Seule une demande en attente peut être annulée');
  }
  await request.update({ status: 'cancelled' });
  return toRequestDto(request);
}

function decisionEmail(request, approved, reason) {
  notify(
    emailService.sendApiKeyRequestDecisionEmail({
      to: request.requester.email,
      name: request.requester.firstName,
      applicationName: request.applicationName,
      approved,
      reason,
      keysUrl: `${publicSiteUrl.replace(/\/+$/, '')}/mes-cles-api`,
    }),
    `décision sur la demande de clé #${request.id} à ${request.requester.email}`
  );
}

async function approveRequest(id, { expiresAt }, adminId) {
  const request = await findRequestOrFail(id);
  if (request.status !== 'pending') {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Cette demande a déjà été traitée');
  }

  // Expiration : celle fixée par l'admin si fournie (null = jamais), sinon
  // la validité demandée.
  const effectiveExpiresAt =
    expiresAt !== undefined
      ? expiresAt
      : request.validityDays
        ? new Date(Date.now() + request.validityDays * DAY_MS)
        : null;

  await ApiKeyRequest.sequelize.transaction(async (transaction) => {
    const { apiKey } = await generate(
      {
        name: request.applicationName,
        description: `Demande #${request.id} — ${request.usageDescription}`.slice(0, 255),
        expiresAt: effectiveExpiresAt,
        createdById: adminId,
        ownerUserId: request.requesterId,
      },
      { transaction }
    );

    await request.update(
      { status: 'approved', reviewedById: adminId, reviewedAt: new Date(), apiKeyId: apiKey.id },
      { transaction }
    );
  });

  decisionEmail(request, true);
  return toRequestDto(await findRequestOrFail(id));
}

async function rejectRequest(id, { reason }, adminId) {
  const request = await findRequestOrFail(id);
  if (request.status !== 'pending') {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Cette demande a déjà été traitée');
  }

  await request.update({
    status: 'rejected',
    reviewedById: adminId,
    reviewedAt: new Date(),
    rejectionReason: reason || null,
  });

  decisionEmail(request, false, reason);
  return toRequestDto(await findRequestOrFail(id));
}

module.exports = {
  list,
  create,
  listMine,
  reveal,
  revoke,
  remove,
  authenticate,
  createRequest,
  listRequests,
  listMyRequests,
  cancelRequest,
  approveRequest,
  rejectRequest,
};
