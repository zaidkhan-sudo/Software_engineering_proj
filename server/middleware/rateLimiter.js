const rateLimit = require('express-rate-limit');
const { fail } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    return fail(
      res,
      429,
      ERROR_CODES.UNAUTHORIZED,
      'Too many authentication attempts. Please try again after 15 minutes.'
    );
  }
});

module.exports = {
  authLimiter
};
