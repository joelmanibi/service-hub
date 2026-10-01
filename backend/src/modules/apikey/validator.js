const Joi = require('joi');

/**
 * Schémas de validation du module ApiKey.
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createApiKeySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(255).allow('', null),
  // Date d'expiration facultative (null = sans expiration), forcément future.
  expiresAt: Joi.date().iso().greater('now').allow(null),
});

module.exports = {
  idParamSchema,
  createApiKeySchema,
};
