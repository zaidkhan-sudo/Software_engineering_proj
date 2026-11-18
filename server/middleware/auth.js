const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { fail } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'Authentication token required');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'Authentication token expired');
      }
      return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'Invalid authentication token');
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'User account no longer exists');
    }

    if (!user.isActive) {
      return fail(res, 401, ERROR_CODES.UNAUTHORIZED, 'Account deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
