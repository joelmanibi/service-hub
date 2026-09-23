const Joi = require('joi');

/**
 * Schémas de validation du module Catalog.
 * Responsabilité : valider les payloads entrants pour la gestion des
 * Services (le module ne gère que ça — pas d'Instance, de pays,
 * d'environnement ni d'hébergement ici). `code` est volontairement
 * absent des schémas : il est généré automatiquement par le service,
 * jamais fourni ni modifiable par le client.
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

// `.single()` : le payload arrive en `multipart/form-data` (logo) — un
// champ répété une seule fois (`cloudServiceModelIds`) est alors reçu par
// Express/multer comme une chaîne isolée plutôt qu'un tableau à un
// élément ; `.single()` normalise ce cas au même titre qu'un tableau.
const createServiceSchema = Joi.object({
  name: Joi.string().trim().max(150).required(),
  serviceTypeId: Joi.number().integer().positive().required(),
  description: Joi.string().trim().allow('', null),
  cloudServiceModelIds: Joi.array().items(Joi.number().integer().positive()).single(),
});

const updateServiceSchema = Joi.object({
  name: Joi.string().trim().max(150),
  serviceTypeId: Joi.number().integer().positive(),
  description: Joi.string().trim().allow('', null),
  cloudServiceModelIds: Joi.array().items(Joi.number().integer().positive()).single(),
}).min(1);

const listServicesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  // `max(500)` plutôt que le `max(100)` habituel des référentiels
  // (module settings) : le nombre de Services a dépassé 100 (une centaine
  // en usage réel), et les selects qui doivent tous les lister en une
  // seule page (formulaire de création d'instance notamment) en ont
  // besoin — cf. InstancesPageClient.tsx.
  limit: Joi.number().integer().min(1).max(500).default(10),
  search: Joi.string().trim().max(150).allow('', null),
  // Filtres relationnels : un Service n'a pas lui-même de Client/Platform/
  // Hosting, mais "a" un Client/une Plateforme/un Hébergement dès qu'au
  // moins une de ses Instances y est rattachée — cf.
  // modules/catalog/service.js#resolveRelationalServiceIds.
  clientId: Joi.number().integer().positive(),
  platformId: Joi.number().integer().positive(),
  hostingId: Joi.number().integer().positive(),
});

module.exports = {
  idParamSchema,
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
};
