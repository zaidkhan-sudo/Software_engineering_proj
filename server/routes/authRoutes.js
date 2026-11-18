const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema
} = require('../validations/authValidation');

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.get('/me', auth, authController.getMe);
router.patch('/me', auth, validate(updateProfileSchema), authController.updateMe);

module.exports = router;
