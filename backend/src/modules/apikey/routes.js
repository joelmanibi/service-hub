const { Router } = require('express');

const controller = require('./controller');
const { idParamSchema, createApiKeySchema } = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module ApiKey.
 * Responsabilité : gestion des clés d'API des applications tierces depuis
 * l'administration (onglet Paramètres → Clés d'API) — réservée aux ADMIN.
 */

const router = Router();

router.use(authGuard, authorize([ROLES.ADMIN]));

router.get('/', controller.list);
router.post('/', validate(createApiKeySchema), controller.create);
router.post('/:id/revoke', validate(idParamSchema, 'params'), controller.revoke);
router.delete('/:id', validate(idParamSchema, 'params'), controller.remove);

module.exports = router;
