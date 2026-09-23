const { Router } = require('express');

const authRoutes = require('../modules/auth/routes');
const usersRoutes = require('../modules/users/routes');
const catalogRoutes = require('../modules/catalog/routes');
const instanceRoutes = require('../modules/instance/routes');
const dashboardRoutes = require('../modules/dashboard/routes');
const settingsRoutes = require('../modules/settings/routes');
const publicRoutes = require('../modules/public/routes');

/**
 * Routeur central de l'API.
 * Responsabilité : agréger le routeur (routes.js) de chaque module
 * métier sous son préfixe respectif, ainsi que les endpoints purement
 * techniques (ex: /health). Ne contient aucune route métier elle-même.
 */

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ServiceHub API is up and running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/catalog', catalogRoutes);
router.use('/instances', instanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/settings', settingsRoutes);
router.use('/public', publicRoutes);

module.exports = router;
