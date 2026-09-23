const ApiError = require('../shared/utils/ApiError');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * Middleware générique de validation des requêtes.
 * Responsabilité : valider `req.body` (par défaut) ou `req.query` /
 * `req.params` à l'aide d'un schéma Joi fourni par le validator.js d'un
 * module, avant que la requête n'atteigne le contrôleur. Générique et
 * réutilisable par tous les modules — ne contient aucun schéma métier.
 */

module.exports = function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const message = error.details.map((detail) => detail.message).join(', ');
      return next(new ApiError(HTTP_STATUS.BAD_REQUEST, message));
    }

    req[property] = value;
    next();
  };
};
