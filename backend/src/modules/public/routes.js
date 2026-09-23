const { Router } = require('express');

const controller = require('./controller');
const { idParamSchema } = require('./validator');
const validate = require('../../middlewares/validate');

/**
 * Routes HTTP du module Public.
 * Responsabilité : exposer, sans authentification (jamais derrière
 * authGuard), une vue en lecture seule du catalogue de Services et de
 * leurs Instances (résumé anonymisé) pour le site public
 * (service-hub-public). N'expose que ce que service.js projette —
 * jamais de route d'écriture ici.
 */

const router = Router();

router.get('/services', controller.listServices);
router.get('/services/:id', validate(idParamSchema, 'params'), controller.getServiceById);
router.get('/services/:id/instances', validate(idParamSchema, 'params'), controller.listServiceInstances);

module.exports = router;
