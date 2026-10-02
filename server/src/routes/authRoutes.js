const express = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const rules = require('../validators/authValidators');

const router = express.Router();

router.get('/demo-accounts', controller.demoAccounts);

router.post('/register', authLimiter, validate(rules.registerRules), controller.register);
router.post('/login', authLimiter, validate(rules.loginRules), controller.login);
router.post('/refresh', authLimiter, validate(rules.refreshRules), controller.refresh);
router.post('/logout', controller.logout);

router.get('/me', protect, controller.me);
router.patch('/password', protect, validate(rules.changePasswordRules), controller.changePassword);

module.exports = router;
