const apiKeyService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module ApiKey.
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer au
 * service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier.
 */

const list = asyncHandler(async (req, res) => {
  const apiKeys = await apiKeyService.list();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Liste des clés d'API", apiKeys));
});

const create = asyncHandler(async (req, res) => {
  const result = await apiKeyService.create(req.body, req.user?.id);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, "Clé d'API créée", result));
});

const revoke = asyncHandler(async (req, res) => {
  const apiKey = await apiKeyService.revoke(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Clé d'API révoquée", apiKey));
});

const remove = asyncHandler(async (req, res) => {
  await apiKeyService.remove(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Clé d'API supprimée", null));
});

module.exports = {
  list,
  create,
  revoke,
  remove,
};
