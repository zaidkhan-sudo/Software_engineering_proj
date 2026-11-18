const { fail } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * 404 Handler for unknown routes
 */
function notFoundHandler(req, res, next) {
  return fail(
    res,
    404,
    ERROR_CODES.NOT_FOUND,
    `Route not found: ${req.method} ${req.originalUrl}`
  );
}

/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let code = err.code || ERROR_CODES.SERVER_ERROR;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // 1. Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = 'Validation failed';
    details = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message
    }));
  }

  // 2. Mongoose Duplicate Key Error (E11000)
  if (err.code === 11000) {
    statusCode = 409;
    code = ERROR_CODES.DUPLICATE;
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  // 3. Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = ERROR_CODES.INVALID_ID;
    message = `Invalid ID format for parameter: ${err.path}`;
  }

  // 4. JWT Authentication Errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ERROR_CODES.UNAUTHORIZED;
    message = 'Authentication token expired';
  }

  // 5. Multer Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    code = ERROR_CODES.UPLOAD_ERROR;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds 1 MB limit';
    } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Maximum 2 attachments allowed';
    } else {
      message = err.message;
    }
  }

  // Log server errors for developer inspection in non-production
  if (statusCode === 500 && process.env.NODE_ENV !== 'test') {
    console.error('Unhandled Server Error:', err);
  }

  return fail(res, statusCode, code, message, details);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
