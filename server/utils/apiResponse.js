/**
 * Standard API Success Response Helper
 * Matches the README Standard Response Format
 */
function success(res, data = null, message = null, statusCode = 200, pagination = null) {
  const responseBody = {
    success: true,
    data
  };

  if (message) {
    responseBody.message = message;
  }

  if (pagination) {
    responseBody.pagination = pagination;
  }

  return res.status(statusCode).json(responseBody);
}

/**
 * Standard API Failure Response Helper
 * Matches the README Standard Error Format
 */
function fail(res, statusCode, code, message, details = null) {
  const errorObj = {
    code,
    message
  };

  if (details && details.length > 0) {
    errorObj.details = details;
  }

  return res.status(statusCode).json({
    success: false,
    error: errorObj
  });
}

module.exports = {
  success,
  fail
};
