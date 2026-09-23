const instanceService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const ApiError = require('../../shared/utils/ApiError');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Instance.
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer le
 * traitement au service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier ni
 * accès direct à la base de données.
 */

const list = asyncHandler(async (req, res) => {
  const result = await instanceService.list(req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des instances', result));
});

const getById = asyncHandler(async (req, res) => {
  const instance = await instanceService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Instance récupérée', instance));
});

const create = asyncHandler(async (req, res) => {
  const instance = await instanceService.create(req.body);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, 'Instance créée', instance));
});

const update = asyncHandler(async (req, res) => {
  const instance = await instanceService.update(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Instance mise à jour', instance));
});

const remove = asyncHandler(async (req, res) => {
  await instanceService.remove(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Instance supprimée'));
});

const uploadArchitectureImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Aucune image n'a été envoyée");
  }

  const instance = await instanceService.setArchitectureImage(req.params.id, `/uploads/${req.file.filename}`);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Schéma d'architecture ajouté", instance));
});

const removeArchitectureImage = asyncHandler(async (req, res) => {
  const instance = await instanceService.removeArchitectureImage(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, "Schéma d'architecture supprimé", instance));
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  uploadArchitectureImage,
  removeArchitectureImage,
};
