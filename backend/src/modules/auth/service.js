const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

const { Credential, RefreshToken } = require('../../database');
const jwtConfig = require('../../config/jwt');
const { env } = require('../../config/env');
const logger = require('../../config/logger');
const otpService = require('../../shared/utils/otp');
const emailService = require('../../shared/utils/emailService');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche service du module Auth (authentification par code OTP).
 * Responsabilité : contenir la logique métier propre à l'authentification
 * (résolution de l'identifiant, émission/rotation des tokens,
 * révocation) et orchestrer les appels aux modèles Credential /
 * RefreshToken. La génération/validation du code OTP est déléguée à
 * shared/utils/otp.js, et l'envoi de l'email à
 * shared/utils/emailService.js — auth ne compose jamais lui-même de
 * contenu d'email, il fournit seulement les données déjà résolues
 * (destinataire, nom, code). Ne manipule jamais req/res (réservé au
 * contrôleur).
 */

const DURATION_UNITS_MS = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

// Convertit une durée au format JWT ("7d", "15m", ...) en date d'expiration.
function durationToExpiryDate(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  const ms = match ? Number(match[1]) * DURATION_UNITS_MS[match[2]] : Number(duration) * 1000;
  return new Date(Date.now() + ms);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateAccessToken(credential, role) {
  return jwt.sign({ id: credential.userId, email: credential.email, role }, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });
}

async function issueRefreshToken(userId) {
  const refreshToken = crypto.randomBytes(64).toString('hex');

  await RefreshToken.create({
    userId,
    tokenHash: sha256(refreshToken),
    expiresAt: durationToExpiryDate(jwtConfig.refreshExpiresIn),
  });

  return refreshToken;
}

function findCredentialByIdentifier(identifier) {
  return Credential.findOne({
    where: { [Op.or]: [{ email: identifier }, { login: identifier }] },
    include: [{ association: 'user' }],
  });
}

/**
 * Vérifie l'identifiant (login ou email) et le compte actif, puis
 * délègue l'émission du code à otpService (purge des OTP actifs
 * précédents + création + hachage) et son envoi à emailService.
 *
 * Signale explicitement si l'identifiant ne correspond à aucun compte,
 * ou si le compte est désactivé (demande produit explicite) — à noter
 * que cela permet à quelqu'un de déterminer par essais successifs
 * quels emails/logins existent dans la base (énumération de comptes) ;
 * ce compromis a été fait sciemment, à la demande, au profit d'un
 * message d'erreur plus clair pour l'utilisateur légitime.
 */
async function requestOtp(identifier) {
  const credential = await findCredentialByIdentifier(identifier);

  if (!credential) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Aucun compte ne correspond à cet identifiant');
  }

  if (!credential.isActive) {
    throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Ce compte est désactivé');
  }

  const code = await otpService.issueOtp(credential.userId);

  if (env !== 'production') {
    // Hors production, le code est loggé immédiatement et l'envoi de
    // l'email n'est pas attendu avant de répondre : utile pour continuer
    // à se connecter/tester quand le serveur SMTP (Gmail) est lent ou
    // injoignable, le temps de corriger la connectivité, sans bloquer la
    // requête dessus.
    logger.info(`[DEV] Code OTP pour ${credential.email} : ${code}`);
    emailService
      .sendOtpEmail({ to: credential.email, name: credential.user.firstName, code })
      .catch((error) => logger.error(`Échec de l'envoi de l'email OTP à ${credential.email} : ${error.message}`));
    return;
  }

  await emailService.sendOtpEmail({
    to: credential.email,
    name: credential.user.firstName,
    code,
  });
}

/**
 * Vérifie le code saisi (délégué à otpService, qui marque l'OTP comme
 * utilisé en cas de succès), puis émet JWT + Refresh Token et enregistre
 * la dernière connexion.
 */
async function verifyOtp(identifier, code) {
  const credential = await findCredentialByIdentifier(identifier);

  if (!credential || !credential.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, otpService.GENERIC_INVALID_MESSAGE);
  }

  await otpService.verifyOtp(credential.userId, code);

  const accessToken = generateAccessToken(credential, credential.user.role);
  const refreshToken = await issueRefreshToken(credential.userId);

  credential.lastLoginAt = new Date();
  await credential.save();

  return {
    accessToken,
    refreshToken,
    user: {
      id: credential.userId,
      login: credential.login,
      email: credential.email,
      role: credential.user.role,
    },
  };
}

async function refreshAccessToken(oldRefreshToken) {
  const stored = await RefreshToken.findOne({ where: { tokenHash: sha256(oldRefreshToken) } });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Refresh token invalide ou expiré');
  }

  const credential = await Credential.findOne({
    where: { userId: stored.userId },
    include: [{ association: 'user' }],
  });

  if (!credential || !credential.isActive) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Compte introuvable ou désactivé');
  }

  // Rotation : le refresh token utilisé est révoqué et remplacé, afin
  // d'empêcher sa réutilisation (protection contre le rejeu).
  stored.revokedAt = new Date();
  await stored.save();

  // Rôle relu à chaque refresh (pas seulement au login) : un changement
  // de rôle par un ADMIN se répercute au prochain refresh, sans attendre
  // l'expiration complète de l'access token.
  const accessToken = generateAccessToken(credential, credential.user.role);
  const refreshToken = await issueRefreshToken(credential.userId);

  return { accessToken, refreshToken };
}

async function logout(userId, refreshToken) {
  const stored = await RefreshToken.findOne({
    where: { userId, tokenHash: sha256(refreshToken) },
  });

  if (!stored || stored.revokedAt) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Session introuvable');
  }

  stored.revokedAt = new Date();
  await stored.save();
}

async function getProfile(userId) {
  const credential = await Credential.findOne({
    where: { userId },
    include: [{ association: 'user' }],
  });

  if (!credential || !credential.isActive) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, 'Utilisateur introuvable');
  }

  return {
    id: credential.userId,
    login: credential.login,
    email: credential.email,
    role: credential.user.role,
    lastLoginAt: credential.lastLoginAt,
  };
}

module.exports = {
  requestOtp,
  verifyOtp,
  refreshAccessToken,
  logout,
  getProfile,
};
