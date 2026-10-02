const escalationService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Escalation : délègue au service et formate
 * la réponse. Aucune logique métier.
 */

const getGlobal = asyncHandler(async (req, res) => {
  const data = await escalationService.getGlobal();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Matrice d'escalade", data));
});

const updateManagerial = asyncHandler(async (req, res) => {
  const data = await escalationService.updateManagerial(req.body);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Escalade managériale mise à jour', data));
});

const updateTechnicalNormal = asyncHandler(async (req, res) => {
  const data = await escalationService.updateTechnicalNormal(req.body);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Escalade technique (process normal) mise à jour', data));
});

const listPodEscalations = asyncHandler(async (req, res) => {
  const data = await escalationService.listPodEscalations();
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Escalade technique par POD', data));
});

const upsertPodEscalation = asyncHandler(async (req, res) => {
  const data = await escalationService.upsertPodEscalation(req.params.podId, req.body);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Escalade technique du POD mise à jour', data));
});

const getMatrixForPod = asyncHandler(async (req, res) => {
  const data = await escalationService.getMatrixForPod(req.params.podId);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Matrice d'escalade du POD", data));
});

module.exports = {
  getGlobal,
  updateManagerial,
  updateTechnicalNormal,
  listPodEscalations,
  upsertPodEscalation,
  getMatrixForPod,
};
