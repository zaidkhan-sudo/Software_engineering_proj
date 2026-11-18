const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');
const {
  createUserSchema,
  updateUserSchema
} = require('../validations/userValidation');

// All user administration endpoints are strictly Admin-only
router.use(auth, authorize(ROLES.ADMIN));

router.get('/', userController.getUsers);
router.post('/', validate(createUserSchema), userController.createUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
