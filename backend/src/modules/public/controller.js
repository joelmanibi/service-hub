const publicService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Public.
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer au
 * service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier.
 */

const listServices = asyncHandler(async (req, res) => {
  const services = await publicService.listServices();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des services', services));
});

const getServiceById = asyncHandler(async (req, res) => {
  const service = await publicService.getServiceById(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Service récupéré', service));
});

const listServiceInstances = asyncHandler(async (req, res) => {
  const instances = await publicService.listServiceInstances(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des instances du service', instances));
});

module.exports = {
  listServices,
  getServiceById,
  listServiceInstances,
};
