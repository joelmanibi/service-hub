const crypto = require('crypto');

const { ApiKey, User } = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module ApiKey.
 * Responsabilité : générer, lister, révoquer et supprimer les clés d'API
 * des applications tierces (module Integration), et vérifier une clé
 * présentée par un appel entrant (`authenticate`, utilisé par
 * middlewares/apiKeyGuard.js). La clé en clair n'est renvoyée qu'une
 * seule fois, par `create` — jamais stockée, jamais relisible ensuite.
 */

const KEY_PREFIX = 'shk_';
const DISPLAY_PREFIX_LENGTH = 12;
// Au plus une écriture "dernière utilisation" par minute et par clé :
// évite une requête UPDATE à chaque appel d'une application très active.
const LAST_USED_THROTTLE_MS = 60 * 1000;

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

function toDto(apiKey) {
  const creator = apiKey.createdBy;
  return {
    id: apiKey.id,
    name: apiKey.name,
    description: apiKey.description,
    keyPrefix: apiKey.keyPrefix,
    status: status(apiKey),
    createdAt: apiKey.createdAt,
    createdBy: creator ? { id: creator.id, name: `${creator.firstName} ${creator.lastName}`.trim() } : null,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    lastUsedAt: apiKey.lastUsedAt,
    lastUsedIp: apiKey.lastUsedIp,
  };
}

const CREATED_BY_INCLUDE = { model: User, as: 'createdBy', attributes: ['id', 'firstName', 'lastName'] };

async function list() {
  const apiKeys = await ApiKey.findAll({ include: [CREATED_BY_INCLUDE], order: [['createdAt', 'DESC']] });
  return apiKeys.map(toDto);
}

async function findOrFail(id) {
  const apiKey = await ApiKey.findByPk(id, { include: [CREATED_BY_INCLUDE] });
  if (!apiKey) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "Clé d'API introuvable");
  }
  return apiKey;
}

async function create({ name, description, expiresAt }, userId) {
  const key = generateKey();
  const apiKey = await ApiKey.create({
    name,
    description: description || null,
    keyPrefix: key.slice(0, DISPLAY_PREFIX_LENGTH),
    keyHash: hashKey(key),
    createdById: userId ?? null,
    expiresAt: expiresAt ?? null,
  });

  const created = await findOrFail(apiKey.id);
  // Seule et unique fois où la clé en clair quitte le serveur.
  return { apiKey: toDto(created), key };
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
 * stockée. Renvoie la clé si elle est active, `null` sinon.
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

module.exports = {
  list,
  create,
  revoke,
  remove,
  authenticate,
};
