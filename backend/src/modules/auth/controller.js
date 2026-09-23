const authService = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Auth (authentification).
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer le
 * traitement au service (service.js) puis formater la réponse via
 * shared/utils/ApiResponse.js. Ne contient aucune logique métier ni
 * accès direct à la base de données.
 */

const requestOtp = asyncHandler(async (req, res) => {
  await authService.requestOtp(req.body.identifier);

  res
    .status(HTTP_STATUS.OK)
    .json(new ApiResponse(true, 'Un code de connexion a été envoyé par email'));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, code } = req.body;
  const result = await authService.verifyOtp(identifier, code);

  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Connexion réussie', result));
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  const result = await authService.refreshAccessToken(token);

  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Token rafraîchi', result));
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;
  await authService.logout(req.user.id, token);

  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Déconnexion réussie'));
});

const profile = asyncHandler(async (req, res) => {
  const result = await authService.getProfile(req.user.id);

  res.status(HTTP_STATUS.OK).json(new ApiResponse(true, 'Profil récupéré', result));
});

module.exports = {
  requestOtp,
  verifyOtp,
  refresh,
  logout,
  profile,
};
