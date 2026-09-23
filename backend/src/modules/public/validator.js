const Joi = require('joi');

/**
 * Schémas de validation du module Public.
 * Responsabilité : valider les paramètres des routes publiques en
 * lecture seule (aucun payload d'écriture dans ce module).
 */

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

module.exports = {
  idParamSchema,
};
