const Joi = require('joi');

/**
 * Schémas de validation du module Instance.
 * Responsabilité : valider les payloads entrants pour la gestion des
 * Instances. `code` est volontairement absent des schémas : il est
 * généré automatiquement par le service, jamais fourni ni modifiable
 * par le client.
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const environmentIdsSchema = Joi.array().items(Joi.number().integer().positive());
const hostingIdsSchema = Joi.array().items(Joi.number().integer().positive());
const networkIdsSchema = Joi.array().items(Joi.number().integer().positive());

// Inventaires : même principe que composants, un niveau plus bas (liste
// envoyée telle quelle, remplace intégralement les inventaires existants
// du composant côté service — cf. modules/instance/service.js).
const inventairesSchema = Joi.array().items(
  Joi.object({
    ip: Joi.string().trim().max(45).required(),
    nomServeur: Joi.string().trim().max(150).required(),
  })
);

// Composants : liste envoyée telle quelle par le formulaire d'instance
// (remplace intégralement les composants existants côté service, pas de
// diff par id — cf. modules/instance/service.js). `platformId` référence
// le référentiel settings.Platform (propre à un Hosting), facultatif.
const composantsSchema = Joi.array().items(
  Joi.object({
    name: Joi.string().trim().max(150).required(),
    description: Joi.string().trim().max(255).allow('', null),
    platformId: Joi.number().integer().positive().allow(null),
    inventaires: inventairesSchema,
  })
);

// Niveaux de support : liste envoyée telle quelle (remplace intégralement
// les assignations existantes côté service — cf. modules/instance/service.js).
// `supportLevelId` référence le référentiel settings.SupportLevel.
const supportLevelsSchema = Joi.array().items(
  Joi.object({
    supportLevelId: Joi.number().integer().positive().required(),
    responsable: Joi.string().trim().max(150).allow('', null),
    telephone: Joi.string().trim().max(30).allow('', null),
  })
);

const createInstanceSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  serviceId: Joi.number().integer().positive().required(),
  clientId: Joi.number().integer().positive().required(),
  podId: Joi.number().integer().positive().required(),
  statutInstanceId: Joi.number().integer().positive().required(),
  comments: Joi.string().trim().allow('', null),
  produitOceane: Joi.string().trim().max(100).allow('', null),
  environmentIds: environmentIdsSchema,
  hostingIds: hostingIdsSchema,
  networkIds: networkIdsSchema,
  composants: composantsSchema,
  supportLevels: supportLevelsSchema,
});

const updateInstanceSchema = Joi.object({
  name: Joi.string().trim().max(150),
  serviceId: Joi.number().integer().positive(),
  clientId: Joi.number().integer().positive(),
  podId: Joi.number().integer().positive(),
  statutInstanceId: Joi.number().integer().positive(),
  comments: Joi.string().trim().allow('', null),
  produitOceane: Joi.string().trim().max(100).allow('', null),
  environmentIds: environmentIdsSchema,
  hostingIds: hostingIdsSchema,
  networkIds: networkIdsSchema,
  composants: composantsSchema,
  supportLevels: supportLevelsSchema,
}).min(1);

const listInstancesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(150).allow('', null),
  countryId: Joi.number().integer().positive(),
  serviceId: Joi.number().integer().positive(),
  serviceTypeId: Joi.number().integer().positive(),
  environmentId: Joi.number().integer().positive(),
  statutInstanceId: Joi.number().integer().positive(),
  podId: Joi.number().integer().positive(),
});

module.exports = {
  idParamSchema,
  createInstanceSchema,
  updateInstanceSchema,
  listInstancesQuerySchema,
};
