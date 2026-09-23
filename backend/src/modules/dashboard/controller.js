const dashboardService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Dashboard (tableau de bord).
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer le
 * traitement au service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier ni
 * accès direct à la base de données.
 */

const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Tableau de bord', overview));
});

module.exports = {
  getOverview,
};
