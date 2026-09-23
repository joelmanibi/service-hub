const { Op } = require('sequelize');

const db = require('../../database');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS, ROLES } = require('../../shared/constants');

const { User, Credential, RefreshToken, UserOtp, sequelize } = db;

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

async function list({ page, limit, search, sortBy, order }) {
  const where = search
    ? {
        [Op.or]: [
          { firstName: { [Op.like]: `%${search}%` } },
          { lastName: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      }
    : {};

  const { rows, count } = await User.findAndCountAll({
    where,
    include: [CREDENTIAL_INCLUDE],
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
  const user = await User.findByPk(id, { include: [CREDENTIAL_INCLUDE] });

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

    return user;
  });

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
  const previousEmail = user.email;
  const emailChanged = Boolean(data.email) && data.email !== previousEmail;

  if (emailChanged) {
    await assertEmailAvailable(data.email, id);
  }

  return sequelize.transaction(async (transaction) => {
    const updatedUser = await user.update(data, { transaction });

    if (emailChanged) {
      await Credential.update({ email: data.email }, { where: { userId: id }, transaction });
    }

    return updatedUser;
  });
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
