const logger = require('../config/logger');
const apiKeyService = require('../modules/apikey/service');
const ApiError = require('../shared/utils/ApiError');
const { HTTP_STATUS } = require('../shared/constants');

/**
 * Middleware d'authentification par clé d'API (applications tierces).
 * Responsabilité : protéger les routes d'intégration machine-à-machine,
 * distinctes des sessions utilisateur (authGuard/JWT). La clé est lue dans
 * l'en-tête `Authorization: Bearer <clé>` ou `X-API-Key: <clé>`, puis
 * vérifiée contre les clés générées depuis l'administration (module
 * apikey — empreinte SHA-256, clé active : ni révoquée ni expirée).
 * Attache le nom de la clé appelante à `req.integrationClient`.
 */

function extractKey(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme === 'Bearer' && token) {
    return token.trim();
  }

  const apiKey = req.headers['x-api-key'];
  return typeof apiKey === 'string' ? apiKey.trim() : '';
}

module.exports = async function apiKeyGuard(req, res, next) {
  const key = extractKey(req);

  if (!key) {
    return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, "Clé d'API requise"));
  }

  try {
    const apiKey = await apiKeyService.authenticate(key, req.ip);

    if (!apiKey) {
      logger.warn(`Integration: clé d'API invalide, révoquée ou expirée (${req.ip} ${req.method} ${req.originalUrl})`);
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, "Clé d'API invalide, révoquée ou expirée"));
    }

    req.integrationClient = apiKey.name;
    logger.info(`Integration: ${apiKey.name} (#${apiKey.id}) ${req.method} ${req.originalUrl}`);
    next();
  } catch (error) {
    next(error);
  }
};
