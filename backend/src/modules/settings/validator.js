const Joi = require('joi');

/**
 * Schémas de validation du module Settings (données de référence).
 * Responsabilité : valider les payloads entrants pour les référentiels.
 * La plupart partagent la même forme générique (name, code, description)
 * — un seul jeu de schémas suffit, réutilisé par chaque sous-routeur.
 * `client` est l'exception : il porte typeClientId (obligatoire) et
 * countryId (facultatif), il a donc son propre jeu de schémas. `hosting`
 * est également particulier : il porte `platforms` (facultatif), la liste
 * des plateformes propres à ce site/hébergement (remplacée en bloc à
 * chaque create/update, pas un id sélectionné dans une liste partagée).
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  code: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(255).allow('', null),
});

const updateSchema = Joi.object({
  name: Joi.string().trim().max(150),
  code: Joi.string().trim().max(50),
  description: Joi.string().trim().max(255).allow('', null),
}).min(1);

const createClientSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  code: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(255).allow('', null),
  typeClientId: Joi.number().integer().positive().required(),
  countryId: Joi.number().integer().positive().allow(null),
});

const updateClientSchema = Joi.object({
  name: Joi.string().trim().max(150),
  code: Joi.string().trim().max(50),
  description: Joi.string().trim().max(255).allow('', null),
  typeClientId: Joi.number().integer().positive(),
  countryId: Joi.number().integer().positive().allow(null),
}).min(1);

// `id` facultatif : présent pour une plateforme existante (mise à jour en
// place côté service, cf. syncPlatforms), absent pour une nouvelle
// plateforme (création) — préserve les id existants, référencés par
// Composant.platformId (module instance).
const platformSchema = Joi.object({
  id: Joi.number().integer().positive(),
  name: Joi.string().trim().max(150).required(),
  description: Joi.string().trim().max(255).allow('', null),
});

const createHostingSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  code: Joi.string().trim().max(50).required(),
  description: Joi.string().trim().max(255).allow('', null),
  platforms: Joi.array().items(platformSchema),
});

const updateHostingSchema = Joi.object({
  name: Joi.string().trim().max(150),
  code: Joi.string().trim().max(50),
  description: Joi.string().trim().max(255).allow('', null),
  platforms: Joi.array().items(platformSchema),
}).min(1);

const listQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().max(150).allow('', null),
});

module.exports = {
  idParamSchema,
  createSchema,
  updateSchema,
  createClientSchema,
  updateClientSchema,
  createHostingSchema,
  updateHostingSchema,
  listQuerySchema,
};
