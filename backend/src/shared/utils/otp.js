const crypto = require('crypto');
const { Op } = require('sequelize');

const { UserOtp } = require('../../database');
const ApiError = require('./ApiError');
const { HTTP_STATUS } = require('../constants');

/**
 * Service OTP (One-Time Password) — code numérique à 6 chiffres, à usage
 * unique, expirant 60 secondes après émission. Indépendant du module
 * auth : ne connaît que `userId`, aucune notion de login/email/JWT.
 * Réutilisable par tout module ayant besoin d'un flux de vérification
 * par code (auth aujourd'hui, potentiellement d'autres demain).
 */

const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const GENERIC_INVALID_MESSAGE = 'Code OTP invalide ou expiré';

function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateNumericCode() {
  const max = 10 ** OTP_LENGTH;
  return String(crypto.randomInt(0, max)).padStart(OTP_LENGTH, '0');
}

/**
 * Émet un nouveau code pour `userId`.
 * Supprime d'abord tout OTP encore actif (non utilisé, non expiré) pour
 * ce même utilisateur, ce qui empêche mécaniquement l'existence de
 * plusieurs OTP actifs simultanés, puis crée le nouveau. Retourne le
 * code en clair — jamais stocké tel quel en base (haché) — à charge du
 * service appelant de le transmettre (email, SMS...).
 */
async function issueOtp(userId) {
  await UserOtp.destroy({
    where: { userId, usedAt: null, expiresAt: { [Op.gt]: new Date() } },
  });

  const code = generateNumericCode();

  await UserOtp.create({
    userId,
    otpCode: hashCode(code),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000),
  });

  return code;
}

/**
 * Vérifie le code saisi pour `userId`.
 * En cas de succès, marque l'OTP comme utilisé (`usedAt`) — la ligne est
 * conservée en historique, jamais supprimée. En cas d'échec, incrémente
 * `attempts` ; au-delà de OTP_MAX_ATTEMPTS, le code est considéré
 * invalide même s'il n'a pas expiré (nouvelle demande obligatoire).
 * Lève une ApiError (401) si le code est invalide, expiré, introuvable
 * ou déjà verrouillé par excès de tentatives.
 */
async function verifyOtp(userId, code) {
  const otp = await UserOtp.findOne({
    where: { userId, usedAt: null },
    order: [['createdAt', 'DESC']],
  });

  if (!otp || otp.expiresAt < new Date()) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, GENERIC_INVALID_MESSAGE);
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, GENERIC_INVALID_MESSAGE);
  }

  if (otp.otpCode !== hashCode(code)) {
    otp.attempts += 1;
    await otp.save();
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, GENERIC_INVALID_MESSAGE);
  }

  otp.usedAt = new Date();
  await otp.save();
}

module.exports = {
  issueOtp,
  verifyOtp,
  GENERIC_INVALID_MESSAGE,
};
