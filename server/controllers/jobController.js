const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { runEscalation } = require('../jobs/escalation');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { success } = require('../utils/apiResponse');
const { ROLES, ERROR_CODES } = require('../utils/constants');

/**
 * Constant-time comparison between provided secret and configured secret
 */
function isCronSecretValid(providedSecret, configuredSecret) {
  if (!providedSecret || !configuredSecret) return false;
  const providedBuffer = Buffer.from(providedSecret);
  const configuredBuffer = Buffer.from(configuredSecret);

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, configuredBuffer);
}

/**
 * @desc    Manually or externally trigger auto-escalation job
 * @route   POST /api/v1/jobs/escalate
 * @access  Admin JWT or x-cron-secret header matching CRON_SECRET
 */
const triggerEscalation = asyncHandler(async (req, res) => {
  const cronSecretHeader = req.headers['x-cron-secret'];
  const configuredSecret = process.env.CRON_SECRET;
  let isAuthorized = false;

  // 1. Check x-cron-secret header
  if (configuredSecret && cronSecretHeader) {
    if (isCronSecretValid(cronSecretHeader, configuredSecret)) {
      isAuthorized = true;
    }
  }

  // 2. Check admin JWT Bearer token if not authorized by cron secret
  if (!isAuthorized && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('isActive role');

      if (user && user.isActive && user.role === ROLES.ADMIN) {
        isAuthorized = true;
      }
    } catch (err) {
      // Continue to unauthorized check
    }
  }

  if (!isAuthorized) {
    throw new AppError(
      401,
      ERROR_CODES.UNAUTHORIZED,
      'Authentication required: provide valid admin JWT or matching x-cron-secret header'
    );
  }

  const result = await runEscalation();

  return success(
    res,
    result,
    'Escalation job executed successfully',
    200
  );
});

module.exports = {
  triggerEscalation
};
