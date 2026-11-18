const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Department = require('../models/Department');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { ROLES, ERROR_CODES } = require('../utils/constants');

/**
 * @desc    List all users with filters and pagination
 * @route   GET /api/v1/users
 * @access  Admin
 */
const getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {};

  if (req.query.role && Object.values(ROLES).includes(req.query.role)) {
    filter.role = req.query.role;
  }

  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter)
  ]);

  const pagination = {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit) || 1
  };

  return success(res, { users }, 'Users retrieved successfully', 200, pagination);
});

/**
 * @desc    Create an officer or admin account
 * @route   POST /api/v1/users
 * @access  Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;

  // Check duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError(409, ERROR_CODES.DUPLICATE, 'Email already registered');
  }

  // Officer accounts require an active department
  let deptDoc = null;
  if (role === ROLES.OFFICER) {
    deptDoc = await Department.findById(department);
    if (!deptDoc || !deptDoc.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Specified department does not exist or is inactive'
      );
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    department: role === ROLES.OFFICER ? department : undefined,
    phone: phone || '',
    isActive: true
  });

  const populatedUser = await User.findById(user._id).populate('department', 'name');

  return success(res, { user: populatedUser }, 'User created successfully', 201);
});

/**
 * @desc    Update user details or role
 * @route   PATCH /api/v1/users/:id
 * @access  Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, department, isActive } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
  }

  // Admin cannot deactivate or demote themselves
  if (req.user._id.toString() === id) {
    if (isActive === false) {
      throw new AppError(
        400,
        ERROR_CODES.FORBIDDEN,
        'Admin cannot deactivate their own account'
      );
    }
    if (role && role !== ROLES.ADMIN) {
      throw new AppError(
        400,
        ERROR_CODES.FORBIDDEN,
        'Admin cannot change their own administrative role'
      );
    }
  }

  const targetRole = role !== undefined ? role : user.role;

  // If role is officer, validate department
  if (targetRole === ROLES.OFFICER) {
    const targetDeptId = department !== undefined ? department : user.department;
    if (!targetDeptId) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Department is required for officer accounts'
      );
    }
    const deptDoc = await Department.findById(targetDeptId);
    if (!deptDoc || !deptDoc.isActive) {
      throw new AppError(
        400,
        ERROR_CODES.VALIDATION_ERROR,
        'Specified department does not exist or is inactive'
      );
    }
    user.department = targetDeptId;
  } else if (role && role !== ROLES.OFFICER) {
    user.department = undefined;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;

  await user.save();

  const populatedUser = await User.findById(user._id).populate('department', 'name');
  return success(res, { user: populatedUser }, 'User updated successfully', 200);
});

/**
 * @desc    Deactivate a user account (soft delete)
 * @route   DELETE /api/v1/users/:id
 * @access  Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (req.user._id.toString() === id) {
    throw new AppError(
      400,
      ERROR_CODES.FORBIDDEN,
      'Admin cannot deactivate their own account'
    );
  }

  const user = await User.findById(id);
  if (!user) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
  }

  user.isActive = false;
  await user.save();

  return success(res, { user }, 'User deactivated successfully', 200);
});

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
