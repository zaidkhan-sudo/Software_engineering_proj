const express = require('express');
const router = express.Router();

const departmentController = require('../controllers/departmentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const { ROLES } = require('../utils/constants');
const {
  createDepartmentSchema,
  updateDepartmentSchema
} = require('../validations/departmentValidation');

// All department management endpoints are strictly Admin-only
router.use(auth, authorize(ROLES.ADMIN));

router.get('/', departmentController.getDepartments);
router.post('/', validate(createDepartmentSchema), departmentController.createDepartment);
router.patch('/:id', validate(updateDepartmentSchema), departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router;
