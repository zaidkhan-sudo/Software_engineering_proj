const { fail } = require('../utils/apiResponse');
const { ERROR_CODES } = require('../utils/constants');

/**
 * Joi Schema Validation Middleware
 * @param {import('joi').ObjectSchema} schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/['"]/g, '')
      }));

      return fail(
        res,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        details[0]?.message || 'Validation failed',
        details
      );
    }

    req.body = value;
    next();
  };
};

module.exports = validate;
