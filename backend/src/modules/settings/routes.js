const { Router } = require('express');

const controllers = require('./controller');
const {
  idParamSchema,
  createSchema,
  updateSchema,
  createClientSchema,
  updateClientSchema,
  createHostingSchema,
  updateHostingSchema,
  listQuerySchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Settings (données de référence).
 * Responsabilité : exposer un même CRUD REST générique pour chacun des
 * référentiels, sous son propre préfixe. Protégé par authGuard +
 * autorisation par rôle : lecture ouverte à ADMIN/VALIDATOR/USER,
 * création/modification à ADMIN/VALIDATOR, suppression réservée à
 * ADMIN — uniforme pour tous les référentiels (Client/TypeClient inclus :
 * ce sont des entités métier du catalogue, pas les utilisateurs
 * applicatifs du module `users`).
 */

const READ = authorize([ROLES.ADMIN, ROLES.VALIDATOR, ROLES.USER]);
const WRITE = authorize([ROLES.ADMIN, ROLES.VALIDATOR]);
const DELETE = authorize([ROLES.ADMIN]);

function buildReferenceRouter(controller, createSchemaOverride = createSchema, updateSchemaOverride = updateSchema) {
  const router = Router();

  router.get('/', READ, validate(listQuerySchema, 'query'), controller.list);
  router.get('/:id', READ, validate(idParamSchema, 'params'), controller.getById);
  router.post('/', WRITE, validate(createSchemaOverride), controller.create);
  router.put(
    '/:id',
    WRITE,
    validate(idParamSchema, 'params'),
    validate(updateSchemaOverride),
    controller.update
  );
  router.delete('/:id', DELETE, validate(idParamSchema, 'params'), controller.remove);

  return router;
}

const router = Router();

router.use(authGuard);

router.use('/countries', buildReferenceRouter(controllers.country));
router.use('/type-clients', buildReferenceRouter(controllers.typeClient));
router.use('/clients', buildReferenceRouter(controllers.client, createClientSchema, updateClientSchema));
router.use('/statuses', buildReferenceRouter(controllers.status));
router.use('/criticalities', buildReferenceRouter(controllers.criticality));
router.use('/technologies', buildReferenceRouter(controllers.technology));
router.use('/hostings', buildReferenceRouter(controllers.hosting, createHostingSchema, updateHostingSchema));
router.use('/environments', buildReferenceRouter(controllers.environment));
router.use('/service-types', buildReferenceRouter(controllers.serviceType));
router.use('/statut-instances', buildReferenceRouter(controllers.statutInstance));
router.use('/pods', buildReferenceRouter(controllers.pod));
router.use('/support-levels', buildReferenceRouter(controllers.supportLevel));
router.use('/cloud-service-models', buildReferenceRouter(controllers.cloudServiceModel));
router.use('/networks', buildReferenceRouter(controllers.network));

module.exports = router;
