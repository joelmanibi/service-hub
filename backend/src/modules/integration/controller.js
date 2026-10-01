const integrationService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Integration.
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer au
 * service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier.
 */

const listInstances = asyncHandler(async (req, res) => {
  const result = await integrationService.listInstances(req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des instances', result));
});

const getInstanceById = asyncHandler(async (req, res) => {
  const instance = await integrationService.getInstanceById(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Fiche de l'instance", instance));
});

const listPodInstances = asyncHandler(async (req, res) => {
  const result = await integrationService.listPodInstances(req.params.pod, req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des instances du POD', result));
});

module.exports = {
  listInstances,
  getInstanceById,
  listPodInstances,
};
