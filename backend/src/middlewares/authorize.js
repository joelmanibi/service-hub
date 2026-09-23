const ApiError = require('../shared/utils/ApiError');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * Middleware d'autorisation par rôle.
 * Responsabilité : restreindre une route aux rôles listés, en se basant
 * sur `req.user.role` (payload JWT, attaché par middlewares/auth.js —
 * doit donc toujours être monté après `authGuard`). Générique et
 * réutilisable par tous les modules — ne contient aucune règle métier
 * propre à l'un d'entre eux, seulement la vérification d'appartenance.
 *
 * Usage : authorize(['ADMIN']), authorize(['ADMIN', 'VALIDATOR']).
 */

module.exports = function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(HTTP_STATUS.FORBIDDEN, 'Accès refusé'));
    }

    next();
  };
};
