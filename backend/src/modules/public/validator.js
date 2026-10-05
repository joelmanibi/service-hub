const Joi = require('joi');

/**
 * Schémas de validation du module Public.
 * Responsabilité : valider les paramètres des routes publiques en
 * lecture seule (aucun payload d'écriture dans ce module).
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const instanceParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  instanceId: Joi.number().integer().positive().required(),
});

// Recherche par IP : adresse complète ou partielle, IPv4 ou IPv6 —
// chiffres hexadécimaux, points et deux-points uniquement (aucun joker SQL
// possible), 2 caractères minimum.
const ipSearchQuerySchema = Joi.object({
  q: Joi.string()
    .trim()
    .min(2)
    .max(45)
    .pattern(/^[0-9a-fA-F.:]+$/)
    .required()
    .messages({ 'string.pattern.base': 'Saisissez une adresse IP (chiffres, points ou deux-points).' }),
});

module.exports = {
  ipSearchQuerySchema,
  idParamSchema,
  instanceParamSchema,
};
