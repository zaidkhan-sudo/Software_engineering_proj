const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * @desc    List all departments (admin only)
 * @route   GET /api/v1/departments
 * @access  Admin
 */
const getDepartments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === 'true';
  }

  const departments = await Department.find(filter).sort({ name: 1 });
  return success(res, { departments }, 'Departments retrieved successfully', 200);
});

/**
 * @desc    Create a new department
 * @route   POST /api/v1/departments
 * @access  Admin
 */
const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, categoriesHandled } = req.body;

  // 1. Check duplicate department name
  const existingDept = await Department.findOne({
    name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
  });
  if (existingDept) {
    throw new AppError(409, ERROR_CODES.DUPLICATE, 'Department name already exists');
  }

  // 2. Enforce category uniqueness across active departments
  if (categoriesHandled && categoriesHandled.length > 0) {
    const conflictingDept = await Department.findOne({
      isActive: true,
      categoriesHandled: { $in: categoriesHandled }
    });

    if (conflictingDept) {
      const conflictCat = categoriesHandled.find((c) =>
        conflictingDept.categoriesHandled.includes(c)
      );
      throw new AppError(
        409,
        ERROR_CODES.DUPLICATE,
        `Category "${conflictCat}" is already handled by department "${conflictingDept.name}"`
      );
    }
  }

  const department = await Department.create({
    name: name.trim(),
    description: description ? description.trim() : '',
    categoriesHandled: categoriesHandled || [],
    isActive: true
  });

  return success(res, { department }, 'Department created successfully', 201);
});

/**
 * @desc    Update department details
 * @route   PATCH /api/v1/departments/:id
 * @access  Admin
 */
const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, categoriesHandled, isActive } = req.body;

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');
  }

  // Check duplicate name if changing
  if (name && name.trim().toLowerCase() !== department.name.toLowerCase()) {
    const existingName = await Department.findOne({
      _id: { $ne: id },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });
    if (existingName) {
      throw new AppError(409, ERROR_CODES.DUPLICATE, 'Department name already exists');
    }
    department.name = name.trim();
  }

  // Check category uniqueness across active departments
  const willBeActive = isActive !== undefined ? isActive : department.isActive;
  const newCategories = categoriesHandled !== undefined ? categoriesHandled : department.categoriesHandled;

  if (willBeActive && newCategories && newCategories.length > 0) {
    const conflictingDept = await Department.findOne({
      _id: { $ne: id },
      isActive: true,
      categoriesHandled: { $in: newCategories }
    });

    if (conflictingDept) {
      const conflictCat = newCategories.find((c) =>
        conflictingDept.categoriesHandled.includes(c)
      );
      throw new AppError(
        409,
        ERROR_CODES.DUPLICATE,
        `Category "${conflictCat}" is already handled by department "${conflictingDept.name}"`
      );
    }
  }

  if (description !== undefined) department.description = description.trim();
  if (categoriesHandled !== undefined) department.categoriesHandled = categoriesHandled;
  if (isActive !== undefined) department.isActive = isActive;

  await department.save();

  return success(res, { department }, 'Department updated successfully', 200);
});

/**
 * @desc    Soft-delete / deactivate a department
 * @route   DELETE /api/v1/departments/:id
 * @access  Admin
 */
const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await Department.findById(id);
  if (!department) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'Department not found');
  }

  department.isActive = false;
  await department.save();

  return success(res, { department }, 'Department deactivated successfully', 200);
});

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
