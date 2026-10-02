const { Router } = require('express');

const controller = require('./controller');
const { managerialSchema, technicalNormalSchema, podEscalationSchema, podIdParamSchema } = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Escalation (matrice d'escalade GOS). Lecture pour
 * tout utilisateur connecté ; modification réservée aux ADMIN/VALIDATOR,
 * comme les autres référentiels (module settings).
 */

const router = Router();
router.use(authGuard);

const WRITE = authorize([ROLES.ADMIN, ROLES.VALIDATOR]);

router.get('/', controller.getGlobal);
router.put('/managerial', WRITE, validate(managerialSchema), controller.updateManagerial);
router.put('/technical-normal', WRITE, validate(technicalNormalSchema), controller.updateTechnicalNormal);
router.get('/pods', controller.listPodEscalations);
router.get('/pods/:podId/matrix', validate(podIdParamSchema, 'params'), controller.getMatrixForPod);
router.put(
  '/pods/:podId',
  WRITE,
  validate(podIdParamSchema, 'params'),
  validate(podEscalationSchema),
  controller.upsertPodEscalation
);

module.exports = router;
