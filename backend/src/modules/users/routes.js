const { Router } = require('express');

const controller = require('./controller');
const {
  idParamSchema,
  createUserSchema,
  updateUserSchema,
  changeRoleSchema,
  listUsersQuerySchema,
} = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Users (utilisateurs).
 * Responsabilité : déclarer les endpoints du module et les relier aux
 * méthodes du contrôleur, en passant par la validation Joi (validate.js).
 * Réservé aux ADMIN : VALIDATOR et USER ne peuvent pas gérer les
 * utilisateurs (authGuard + authorize appliqués à tout le module).
 * Pas de suppression exposée (soft delete only, jamais physique) —
 * la désactivation est le mécanisme métier de mise hors service.
 */

const router = Router();

router.use(authGuard, authorize([ROLES.ADMIN]));

router.get('/', validate(listUsersQuerySchema, 'query'), controller.list);
router.get('/:id', validate(idParamSchema, 'params'), controller.getById);
router.post('/', validate(createUserSchema), controller.create);
router.put('/:id', validate(idParamSchema, 'params'), validate(updateUserSchema), controller.update);
router.patch('/:id/activate', validate(idParamSchema, 'params'), controller.activate);
router.patch('/:id/deactivate', validate(idParamSchema, 'params'), controller.deactivate);
router.patch(
  '/:id/role',
  validate(idParamSchema, 'params'),
  validate(changeRoleSchema),
  controller.changeRole
);
router.patch('/:id/reset-access', validate(idParamSchema, 'params'), controller.resetAccess);

module.exports = router;
