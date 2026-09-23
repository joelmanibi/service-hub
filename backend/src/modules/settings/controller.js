const services = require('./service');
const asyncHandler = require('../../shared/utils/asyncHandler');
const ApiResponse = require('../../shared/utils/ApiResponse');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Couche contrôleur du module Settings (données de référence).
 * Responsabilité : recevoir les requêtes HTTP (req/res), déléguer au
 * service correspondant puis formater la réponse via ApiResponse — un
 * seul contrôleur générique, réutilisé pour chaque référentiel. Ne
 * contient aucune logique métier ni accès direct à la base de données.
 */

function createReferenceController(service, entityLabel) {
  return {
    list: asyncHandler(async (req, res) => {
      const result = await service.list(req.query);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(true, `Liste : ${entityLabel}`, result));
    }),

    getById: asyncHandler(async (req, res) => {
      const item = await service.getById(req.params.id);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(true, `${entityLabel} récupéré`, item));
    }),

    create: asyncHandler(async (req, res) => {
      const item = await service.create(req.body);
      res.status(HTTP_STATUS.CREATED).json(new ApiResponse(true, `${entityLabel} créé`, item));
    }),

    update: asyncHandler(async (req, res) => {
      const item = await service.update(req.params.id, req.body);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(true, `${entityLabel} mis à jour`, item));
    }),

    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.status(HTTP_STATUS.OK).json(new ApiResponse(true, `${entityLabel} supprimé`));
    }),
  };
}

module.exports = {
  country: createReferenceController(services.country, 'Pays'),
  typeClient: createReferenceController(services.typeClient, 'Type de client'),
  client: createReferenceController(services.client, 'Client'),
  status: createReferenceController(services.status, 'Statut'),
  criticality: createReferenceController(services.criticality, 'Criticité'),
  technology: createReferenceController(services.technology, 'Technologie'),
  hosting: createReferenceController(services.hosting, 'Hébergement'),
  environment: createReferenceController(services.environment, 'Environnement'),
  serviceType: createReferenceController(services.serviceType, 'Type de service'),
  statutInstance: createReferenceController(services.statutInstance, 'Statut'),
  pod: createReferenceController(services.pod, 'Pod'),
  supportLevel: createReferenceController(services.supportLevel, 'Niveau de support'),
  cloudServiceModel: createReferenceController(services.cloudServiceModel, 'Modèle de service cloud'),
  network: createReferenceController(services.network, 'Réseau'),
};
