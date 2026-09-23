const jwt = require('jsonwebtoken');

const jwtConfig = require('../config/jwt');
const ApiError = require('../shared/utils/ApiError');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * Middleware d'authentification.
 * Responsabilité : protéger les routes qui l'exigent en vérifiant la
 * présence et la validité d'un token JWT dans l'en-tête `Authorization`
 * (format `Bearer <token>`), puis attacher le payload authentifié à
 * `req.user`. Générique et réutilisable par tous les modules.
 */

module.exports = function authGuard(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentification requise'));
  }

  try {
    req.user = jwt.verify(token, jwtConfig.secret);
    next();
  } catch (error) {
    next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Token invalide ou expiré'));
  }
};
