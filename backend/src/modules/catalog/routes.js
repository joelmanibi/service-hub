const { Router } = require('express');

const controller = require('./controller');
const {
  idParamSchema,
  createServiceSchema,
  updateServiceSchema,
  listServicesQuerySchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const uploadImage = require('../../config/multer');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Catalog.
 * Responsabilité : exposer le CRUD des Services sous `/services` — seule
 * ressource gérée par ce module (pas d'Instance, de pays, d'environnement
 * ni d'hébergement ici). Protégé par authGuard + autorisation par rôle :
 * lecture ouverte à ADMIN/VALIDATOR/USER, création/modification à
 * ADMIN/VALIDATOR, suppression réservée à ADMIN.
 *
 * Création/modification acceptent `multipart/form-data` (logo optionnel,
 * champ `logo` — cf. config/multer.js) : `uploadImage.single('logo')`
 * s'exécute avant `validate`, qui ne voit donc que les champs texte dans
 * `req.body` (le fichier est déposé dans `req.file`, hors validation Joi).
 */

const router = Router();

router.use(authGuard);

const READ = authorize([ROLES.ADMIN, ROLES.VALIDATOR, ROLES.USER]);
const WRITE = authorize([ROLES.ADMIN, ROLES.VALIDATOR]);
const DELETE = authorize([ROLES.ADMIN]);

router.get('/services', READ, validate(listServicesQuerySchema, 'query'), controller.list);
router.get('/services/:id', READ, validate(idParamSchema, 'params'), controller.getById);
router.post('/services', WRITE, uploadImage.single('logo'), validate(createServiceSchema), controller.create);
router.put(
  '/services/:id',
  WRITE,
  uploadImage.single('logo'),
  validate(idParamSchema, 'params'),
  validate(updateServiceSchema),
  controller.update
);
router.delete('/services/:id', DELETE, validate(idParamSchema, 'params'), controller.remove);

module.exports = router;
