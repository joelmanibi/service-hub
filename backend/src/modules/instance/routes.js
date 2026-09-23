const { Router } = require('express');

const controller = require('./controller');
const {
  idParamSchema,
  createInstanceSchema,
  updateInstanceSchema,
  listInstancesQuerySchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const uploadImage = require('../../config/multer');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Instance.
 * Responsabilité : exposer le CRUD des Instances (déploiements concrets
 * d'un Service), ainsi que le schéma d'architecture (image) associé —
 * `multipart/form-data` dédié (`uploadImage.single('architectureImage')`),
 * séparé du payload JSON de create/update pour ne pas avoir à
 * sérialiser les champs imbriqués (composants, niveaux de support,
 * environnements/hébergements) en `FormData`. Protégé par authGuard +
 * autorisation par rôle : lecture ouverte à ADMIN/VALIDATOR/USER,
 * création/modification (dont le schéma d'architecture) à
 * ADMIN/VALIDATOR, suppression réservée à ADMIN.
 */

const router = Router();

router.use(authGuard);

const READ = authorize([ROLES.ADMIN, ROLES.VALIDATOR, ROLES.USER]);
const WRITE = authorize([ROLES.ADMIN, ROLES.VALIDATOR]);
const DELETE = authorize([ROLES.ADMIN]);

router.get('/', READ, validate(listInstancesQuerySchema, 'query'), controller.list);
router.get('/:id', READ, validate(idParamSchema, 'params'), controller.getById);
router.post('/', WRITE, validate(createInstanceSchema), controller.create);
router.put(
  '/:id',
  WRITE,
  validate(idParamSchema, 'params'),
  validate(updateInstanceSchema),
  controller.update
);
router.delete('/:id', DELETE, validate(idParamSchema, 'params'), controller.remove);

// Schéma d'architecture (image) : multipart dédié, indépendant du
// payload JSON de create/update — cf. instance/service.js.
router.post(
  '/:id/architecture-image',
  WRITE,
  validate(idParamSchema, 'params'),
  uploadImage.single('architectureImage'),
  controller.uploadArchitectureImage
);
router.delete(
  '/:id/architecture-image',
  WRITE,
  validate(idParamSchema, 'params'),
  controller.removeArchitectureImage
);

module.exports = router;
