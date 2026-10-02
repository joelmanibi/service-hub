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

// --- Clés ---

const list = asyncHandler(async (req, res) => {
  const apiKeys = await apiKeyService.list();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Liste des clés d'API", apiKeys));
});

const create = asyncHandler(async (req, res) => {
  const result = await apiKeyService.create(req.body, req.user?.id);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, "Clé d'API créée", result));
});

const listMine = asyncHandler(async (req, res) => {
  const apiKeys = await apiKeyService.listMine(req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Mes clés d'API", apiKeys));
});

const reveal = asyncHandler(async (req, res) => {
  const result = await apiKeyService.reveal(req.params.id, req.user);
  res.set('Cache-Control', 'no-store');
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Clé d'API", result));
});

const revoke = asyncHandler(async (req, res) => {
  const apiKey = await apiKeyService.revoke(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Clé d'API révoquée", apiKey));
});

const remove = asyncHandler(async (req, res) => {
  await apiKeyService.remove(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Clé d'API supprimée", null));
});

// --- Demandes ---

const createRequest = asyncHandler(async (req, res) => {
  const request = await apiKeyService.createRequest(req.body, req.user.id);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, 'Demande de clé envoyée', request));
});

const listMyRequests = asyncHandler(async (req, res) => {
  const requests = await apiKeyService.listMyRequests(req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Mes demandes de clé', requests));
});

const cancelRequest = asyncHandler(async (req, res) => {
  const request = await apiKeyService.cancelRequest(req.params.id, req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Demande annulée', request));
});

const listRequests = asyncHandler(async (req, res) => {
  const requests = await apiKeyService.listRequests(req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Demandes de clé', requests));
});

const approveRequest = asyncHandler(async (req, res) => {
  const request = await apiKeyService.approveRequest(req.params.id, req.body, req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Demande approuvée', request));
});

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await apiKeyService.rejectRequest(req.params.id, req.body, req.user.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Demande refusée', request));
});

module.exports = {
  list,
  create,
  listMine,
  reveal,
  revoke,
  remove,
  createRequest,
  listMyRequests,
  cancelRequest,
  listRequests,
  approveRequest,
  rejectRequest,
};
