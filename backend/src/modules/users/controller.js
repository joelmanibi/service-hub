const usersService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Users (utilisateurs).
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer le
 * traitement au service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier ni
 * accès direct à la base de données.
 */

const list = asyncHandler(async (req, res) => {
  const result = await usersService.list(req.query);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Liste des utilisateurs', result));
});

const getById = asyncHandler(async (req, res) => {
  const user = await usersService.getById(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Utilisateur récupéré', user));
});

const create = asyncHandler(async (req, res) => {
  const user = await usersService.create(req.body);
  res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, 'Utilisateur créé', user));
});

const update = asyncHandler(async (req, res) => {
  const user = await usersService.update(req.params.id, req.body);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Utilisateur mis à jour', user));
});

const activate = asyncHandler(async (req, res) => {
  const user = await usersService.activate(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Utilisateur activé', user));
});

const deactivate = asyncHandler(async (req, res) => {
  const user = await usersService.deactivate(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Utilisateur désactivé', user));
});

const changeRole = asyncHandler(async (req, res) => {
  const user = await usersService.changeRole(req.params.id, req.body.role);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Rôle mis à jour', user));
});

const resetAccess = asyncHandler(async (req, res) => {
  await usersService.resetAccess(req.params.id);
  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Accès réinitialisé'));
});

module.exports = {
  list,
  getById,
  create,
  update,
  activate,
  deactivate,
  changeRole,
  resetAccess,
};
