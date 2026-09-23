const Joi = require('joi');

/**
 * Schémas de validation du module Auth (authentification par code OTP).
 * Responsabilité : valider les payloads entrants du module avant qu'ils
 * n'atteignent le contrôleur, via le middleware middlewares/validate.js.
 */

const identifierSchema = Joi.string().trim().max(150).required();

const requestOtpSchema = Joi.object({
  identifier: identifierSchema,
});

const verifyOtpSchema = Joi.object({
  identifier: identifierSchema,
  code: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  requestOtpSchema,
  verifyOtpSchema,
  refreshTokenSchema,
  logoutSchema,
};
