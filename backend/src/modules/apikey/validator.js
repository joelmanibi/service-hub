const Joi = require('joi');

/**
 * Schémas de validation du module ApiKey (clés et demandes de clés).
 */

const VALIDITY_DAYS = [30, 90, 180, 365];

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createApiKeySchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(255).allow('', null),
  // Date d'expiration facultative (null = sans expiration), forcément future.
  expiresAt: Joi.date().iso().greater('now').allow(null),
  // Utilisateur à qui la clé est attribuée (il pourra l'afficher).
  ownerUserId: Joi.number().integer().positive().allow(null),
});

const createApiKeyRequestSchema = Joi.object({
  applicationName: Joi.string().trim().min(2).max(100).required(),
  usageDescription: Joi.string().trim().min(10).max(2000).required(),
  // Validité souhaitée en jours ; null = sans expiration.
  validityDays: Joi.number()
    .valid(...VALIDITY_DAYS)
    .allow(null)
    .default(365),
});

const listApiKeyRequestsQuerySchema = Joi.object({
  status: Joi.string().valid('pending', 'approved', 'rejected', 'cancelled'),
});

const approveApiKeyRequestSchema = Joi.object({
  // Absent : validité demandée ; null : sans expiration ; date : expiration fixée par l'admin.
  expiresAt: Joi.date().iso().greater('now').allow(null),
});

const rejectApiKeyRequestSchema = Joi.object({
  reason: Joi.string().trim().max(500).allow('', null),
});

module.exports = {
  idParamSchema,
  createApiKeySchema,
  createApiKeyRequestSchema,
  listApiKeyRequestsQuerySchema,
  approveApiKeyRequestSchema,
  rejectApiKeyRequestSchema,
};
