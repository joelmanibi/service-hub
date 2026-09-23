const { Router } = require('express');

const controller = require('./controller');
const authGuard = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../shared/constants');

/**
 * Routes HTTP du module Dashboard (tableau de bord).
 * Responsabilité : exposer l'agrégation de KPI en lecture seule. Ouvert
 * aux trois rôles applicatifs (ADMIN/VALIDATOR/USER), comme la lecture
 * des autres modules métier.
 */

const router = Router();

router.use(authGuard, authorize([ROLES.ADMIN, ROLES.VALIDATOR, ROLES.USER]));

router.get('/', controller.getOverview);

module.exports = router;
