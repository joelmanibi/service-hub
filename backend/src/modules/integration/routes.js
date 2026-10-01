const { Router } = require('express');

const controller = require('./controller');
const {
  idParamSchema,
  listInstancesQuerySchema,
  podParamSchema,
  podInstancesQuerySchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const apiKeyGuard = require('../../middlewares/apiKeyGuard');

/**
 * Routes HTTP du module Integration.
 * Responsabilité : exposer en lecture seule, aux applications tierces
 * authentifiées par clé d'API (apiKeyGuard — jamais par JWT utilisateur),
 * la liste paginée et la fiche complète des Instances, inventaire compris.
 * Jamais de route d'écriture ici.
 */

const router = Router();

router.use(apiKeyGuard);

router.get('/instances', validate(listInstancesQuerySchema, 'query'), controller.listInstances);
router.get('/instances/:id', validate(idParamSchema, 'params'), controller.getInstanceById);
router.get(
  '/pods/:pod/instances',
  validate(podParamSchema, 'params'),
  validate(podInstancesQuerySchema, 'query'),
  controller.listPodInstances
);

module.exports = router;
