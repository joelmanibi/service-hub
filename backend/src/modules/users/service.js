const { Op } = require('sequelize');

const db = require('../../database');
const { publicSiteUrl } = require('../../config/env');
const logger = require('../../config/logger');
const emailService = require('../../shared/utils/emailService');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS, ROLES } = require('../../shared/constants');

const { User, Credential, RefreshToken, UserOtp, Pod, UserPod, sequelize } = db;

/**
 * Couche service du module Users (utilisateurs).
 * Responsabilité : contenir la logique métier du module (recherche,
 * pagination, tri, unicité email/login, création liée au Credential,
 * activation/désactivation, changement de rôle, réinitialisation
 * d'accès) et orchestrer les appels aux modèles User / Credential /
 * RefreshToken / UserOtp. Ne manipule jamais req/res (réservé au
 * contrôleur). Aucune suppression physique : `User` est `paranoid`,
 * `.destroy()` (si jamais utilisé) renseigne `deletedAt`.
 */

// login/dernière connexion vivent sur Credential (module auth), pas sur
// User : toujours inclus pour que l'API expose un utilisateur "complet"
// sans que l'appelant ait à faire une seconde requête.
const CREDENTIAL_INCLUDE = {
  association: 'credential',
  attributes: ['login', 'email', 'isActive', 'lastLoginAt'],
};

// Pods de rattachement de l'utilisateur (many-to-many, table user_pods).
const PODS_INCLUDE = {
  association: 'pods',
  attributes: ['id', 'code', 'name'],
  through: { attributes: [] },
};

async function list({ page, limit, search, podId, sortBy, order }) {
  const where = {};

  if (search) {
    const term = `%${search}%`;
    // Le login vit sur Credential : ids résolus à part (une condition
    // `$credential.login$` casserait la sous-requête générée par Sequelize
    // pour paginer avec l'include many-to-many `pods`).
    const byLogin = await Credential.findAll({ where: { login: { [Op.like]: term } }, attributes: ['userId'] });

    where[Op.or] = [
      { firstName: { [Op.like]: term } },
      { lastName: { [Op.like]: term } },
      { email: { [Op.like]: term } },
      { phone: { [Op.like]: term } },
      // "Prénom Nom" ou "Nom Prénom" saisi en entier.
      sequelize.where(sequelize.fn('CONCAT', sequelize.col('first_name'), ' ', sequelize.col('last_name')), {
        [Op.like]: term,
      }),
      sequelize.where(sequelize.fn('CONCAT', sequelize.col('last_name'), ' ', sequelize.col('first_name')), {
        [Op.like]: term,
      }),
      ...(byLogin.length > 0 ? [{ id: byLogin.map((credential) => credential.userId) }] : []),
    ];
  }

  // Filtre par pod en deux temps (ids des utilisateurs rattachés, puis
  // requête principale) : un `where` sur l'include `pods` ne renverrait,
  // pour chaque utilisateur, que ce pod-là au lieu de tous ses pods.
  if (podId) {
    const links = await UserPod.findAll({ where: { podId }, attributes: ['userId'] });
    where.id = links.map((link) => link.userId);
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [CREDENTIAL_INCLUDE, PODS_INCLUDE],
    order: [[sortBy, order.toUpperCase()]],
    limit,
    offset: (page - 1) * limit,
    distinct: true,
  });

  return {
    items: rows,
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit) || 1,
  };
}

async function getById(id) {
  const user = await User.findByPk(id, { include: [CREDENTIAL_INCLUDE, PODS_INCLUDE] });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Utilisateur introuvable');
  }

  return user;
}

async function assertEmailAvailable(email, excludeId = null) {
  const where = excludeId ? { email, id: { [Op.ne]: excludeId } } : { email };
  const existing = await User.findOne({ where });

  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Cet email est déjà utilisé');
  }
}

async function assertPodsExist(podIds) {
  if (!podIds || podIds.length === 0) return;

  const found = await Pod.count({ where: { id: podIds } });
  if (found !== podIds.length) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Un ou plusieurs pods sont introuvables');
  }
}

async function assertLoginAvailable(login) {
  const existing = await Credential.findOne({ where: { login } });

  if (existing) {
    throw new ApiError(HTTP_STATUS.CONFLICT, 'Ce login est déjà utilisé');
  }
}

/**
 * Crée le User ainsi que le Credential (login) qui lui permet de se
 * connecter via OTP — un utilisateur créé sans Credential ne pourrait
 * jamais s'authentifier. Les deux insertions sont atomiques (transaction).
 */
async function create(data) {
  await assertEmailAvailable(data.email);
  await assertLoginAvailable(data.login);
  await assertPodsExist(data.podIds);

  const created = await sequelize.transaction(async (transaction) => {
    const user = await User.create(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role || ROLES.USER,
      },
      { transaction }
    );

    await Credential.create(
      {
        userId: user.id,
        login: data.login,
        email: data.email,
        isActive: true,
      },
      { transaction }
    );

    if (data.podIds && data.podIds.length > 0) {
      await user.setPods(data.podIds, { transaction });
    }

    return user;
  });

  // Email de bienvenue (lien vers le catalogue public) envoyé en arrière-
  // plan : un échec d'envoi (SMTP indisponible...) est journalisé mais
  // n'annule jamais la création du compte, déjà enregistrée.
  emailService
    .sendAccountCreatedEmail({
      to: data.email,
      name: data.firstName,
      login: data.login,
      publicUrl: publicSiteUrl,
    })
    .then(() => logger.info(`Email de création de compte envoyé à ${data.email}`))
    .catch((error) =>
      logger.error(`Échec de l'envoi de l'email de création de compte à ${data.email} : ${error.message}`)
    );

  // Re-chargé avec son Credential (login) : même forme de réponse que
  // list/getById, sans quoi la création renverrait un utilisateur sans
  // login alors qu'il en a bien un.
  return getById(created.id);
}

/**
 * `Credential.email` (utilisé pour la connexion/l'envoi de l'OTP) est une
 * colonne distincte de `User.email` (profil) — sans synchronisation
 * explicite, changer l'email d'un utilisateur ici le désynchroniserait
 * de son Credential, rendant le compte injoignable par email pour l'OTP
 * tout en semblant à jour côté profil. Les deux mises à jour sont donc
 * atomiques (transaction), comme pour `create`.
 */
async function update(id, data) {
  const user = await getById(id);
  const { podIds, ...fields } = data;
  const previousEmail = user.email;
  const emailChanged = Boolean(fields.email) && fields.email !== previousEmail;

  if (emailChanged) {
    await assertEmailAvailable(fields.email, id);
  }
  await assertPodsExist(podIds);

  await sequelize.transaction(async (transaction) => {
    if (Object.keys(fields).length > 0) {
      await user.update(fields, { transaction });
    }

    if (emailChanged) {
      await Credential.update({ email: fields.email }, { where: { userId: id }, transaction });
    }

    if (podIds) {
      await user.setPods(podIds, { transaction });
    }
  });

  return getById(id);
}

/**
 * Réactive le compte : profil (User.isActive) et accès (Credential.isActive)
 * remis en phase, sans quoi un compte "réactivé" resterait bloqué côté
 * authentification.
 */
async function activate(id) {
  const user = await getById(id);
  user.isActive = true;
  await user.save();

  await Credential.update({ isActive: true }, { where: { userId: id } });

  return user;
}

/**
 * Désactive le compte : profil et accès mis en cohérence (empêche la
 * connexion via OTP tant que le compte est désactivé). C'est le
 * mécanisme métier de mise hors service — jamais une suppression.
 */
async function deactivate(id) {
  const user = await getById(id);
  user.isActive = false;
  await user.save();

  await Credential.update({ isActive: false }, { where: { userId: id } });

  return user;
}

async function changeRole(id, role) {
  const user = await getById(id);
  user.role = role;
  await user.save();

  return user;
}

/**
 * Réinitialise l'accès d'un utilisateur : révoque toutes ses sessions
 * actives (Refresh Tokens) et supprime tout OTP en attente. L'utilisateur
 * est déconnecté partout et doit redemander un code OTP pour se
 * reconnecter. Il n'y a pas de mot de passe à réinitialiser
 * (authentification OTP).
 */
async function resetAccess(id) {
  await getById(id);

  await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: id, revokedAt: null } });

  await UserOtp.destroy({ where: { userId: id, usedAt: null } });
}

module.exports = {
  list,
  getById,
  create,
  update,
  activate,
  deactivate,
  changeRole,
  resetAccess,
};
