const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const { ROLES, ERROR_CODES } = require('../utils/constants');

/**
 * Helper to generate signed JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
}

/**
 * @desc    Register a new citizen account
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check for duplicate email (case-insensitive)
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError(409, ERROR_CODES.DUPLICATE, 'Email already registered');
  }

  // Hash password using bcryptjs with 10 salt rounds
  const passwordHash = await bcrypt.hash(password, 10);

  // Always force citizen role on public registration
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role: ROLES.CITIZEN,
    phone: phone || '',
    isActive: true
  });

  const token = generateToken(user);

  return success(
    res,
    { user, token },
    'User registered successfully',
    201
  );
});

/**
 * @desc    Login and receive JWT
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });

  // Uniform error message for missing user or invalid password
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Invalid credentials');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, 'Account deactivated');
  }

  const token = generateToken(user);

  return success(
    res,
    { user, token },
    'Login successful',
    200
  );
});

/**
 * @desc    Get current user profile
 * @route   GET /api/v1/auth/me
 * @access  Authenticated
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('department', 'name');
  return success(res, { user }, 'User profile retrieved', 200);
});

/**
 * @desc    Update own profile
 * @route   PATCH /api/v1/auth/me
 * @access  Authenticated
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name, phone, password } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError(404, ERROR_CODES.NOT_FOUND, 'User not found');
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (password !== undefined) {
    user.passwordHash = await bcrypt.hash(password, 10);
  }

  await user.save();

  return success(res, { user }, 'Profile updated successfully', 200);
});

module.exports = {
  register,
  login,
  getMe,
  updateMe
};
