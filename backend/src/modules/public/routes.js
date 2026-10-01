const { Router } = require('express');

const controller = require('./controller');
const { idParamSchema, instanceParamSchema } = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');

/**
 * Routes HTTP du module Public.
 * Responsabilité : exposer, sans authentification, une vue en lecture
 * seule du catalogue de Services et de leurs Instances (résumé anonymisé)
 * pour le site public (service-hub-public) — à l'exception de la route
 * `/sensitive`, protégée par authGuard. N'expose que ce que service.js
 * projette — jamais de route d'écriture ici.
 */

const router = Router();

router.get('/services', controller.listServices);
router.get('/instances', controller.listInstances);
router.get('/services/:id', validate(idParamSchema, 'params'), controller.getServiceById);
router.get('/services/:id/instances', validate(idParamSchema, 'params'), controller.listServiceInstances);
router.get(
  '/services/:id/instances/:instanceId',
  validate(instanceParamSchema, 'params'),
  controller.getServiceInstanceById
);

// Seule route protégée du module : client, composants (avec inventaire
// IP/serveurs) et contacts de support d'une instance, affichés par le site
// public uniquement à un utilisateur connecté (tout compte ServiceHub).
router.get(
  '/services/:id/instances/:instanceId/sensitive',
  authGuard,
  validate(instanceParamSchema, 'params'),
  controller.getServiceInstanceSensitive
);

module.exports = router;
