const { fail } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return fail(
        res,
        403,
        ERROR_CODES.FORBIDDEN,
        'Access forbidden: insufficient permissions'
      );
    }
    next();
  };
};

module.exports = authorize;
