const Joi = require('joi');

/**
 * Schémas de validation du module Integration.
 * Responsabilité : valider les paramètres des routes d'intégration en
 * lecture seule (pagination, filtres, identifiant).
 */

const MAX_LIMIT = 500;

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const listInstancesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(MAX_LIMIT).default(100),
  serviceId: Joi.number().integer().positive(),
  clientId: Joi.number().integer().positive(),
  podId: Joi.number().integer().positive(),
  statutInstanceId: Joi.number().integer().positive(),
  // Synchronisation incrémentale : uniquement les instances modifiées
  // depuis cette date (ISO 8601), bornes incluses.
  updatedSince: Joi.date().iso(),
});

// POD désigné par son code (ex. "WECA"), son nom ou son id.
const podParamSchema = Joi.object({
  pod: Joi.string().trim().min(1).max(150).required(),
});

// Mêmes paramètres que la liste générale, le POD étant porté par l'URL.
const podInstancesQuerySchema = listInstancesQuerySchema.keys({ podId: Joi.forbidden() });

module.exports = {
  idParamSchema,
  listInstancesQuerySchema,
  podParamSchema,
  podInstancesQuerySchema,
};
