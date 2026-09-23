const catalogService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Catalog.
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer le
 * traitement au service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier ni
 * accès direct à la base de données.
 */

const list = asyncHandler(async (req, res) => {
  const result = await catalogService.list(req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des services', result));
});

const getById = asyncHandler(async (req, res) => {
  const service = await catalogService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Service récupéré', service));
});

const create = asyncHandler(async (req, res) => {
  const payload = req.file ? { ...req.body, logoUrl: `/uploads/${req.file.filename}` } : req.body;
  const service = await catalogService.create(payload);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, 'Service créé', service));
});

const update = asyncHandler(async (req, res) => {
  const payload = req.file ? { ...req.body, logoUrl: `/uploads/${req.file.filename}` } : req.body;
  const service = await catalogService.update(req.params.id, payload);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Service mis à jour', service));
});

const remove = asyncHandler(async (req, res) => {
  await catalogService.remove(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Service supprimé'));
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
