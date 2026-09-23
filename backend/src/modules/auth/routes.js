const { Router } = require('express');

const controller = require('./controller');
const { requestOtpSchema, verifyOtpSchema, refreshTokenSchema, logoutSchema } = require('./validator');
const validate = require('../../middlewares/validate');
const authGuard = require('../../middlewares/auth');

/**
 * Routes HTTP du module Auth (authentification par code OTP).
 * Responsabilité : déclarer les endpoints du module et les relier aux
 * méthodes du contrôleur, en passant par les middlewares de validation
 * (validate.js) et d'authentification (auth.js) là où requis.
 */

const router = Router();

router.post('/request-otp', validate(requestOtpSchema), controller.requestOtp);
router.post('/verify-otp', validate(verifyOtpSchema), controller.verifyOtp);
router.post('/refresh', validate(refreshTokenSchema), controller.refresh);
router.post('/logout', authGuard, validate(logoutSchema), controller.logout);
router.get('/profile', authGuard, controller.profile);

module.exports = router;
