const Joi = require('joi');
const { ROLES } = require('../utils/constants');

const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 60 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.empty': 'Email is required',
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).max(128).required().messages({
    'string.empty': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
    'any.required': 'Password is required'
  }),
  role: Joi.string()
    .valid(ROLES.OFFICER, ROLES.ADMIN)
    .required()
    .messages({
      'any.only': 'Admin can only create officer or admin accounts',
      'any.required': 'Role is required'
    }),
  department: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .when('role', {
      is: ROLES.OFFICER,
      then: Joi.required().messages({
        'any.required': 'Department is required for officer accounts',
        'string.pattern.base': 'Invalid department ID format'
      }),
      otherwise: Joi.optional().allow(null, '')
    }),
  phone: Joi.string().trim().allow('').optional()
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(60).optional().messages({
    'string.min': 'Name must be at least 2 characters',
    'string.max': 'Name cannot exceed 60 characters'
  }),
  role: Joi.string().valid(...Object.values(ROLES)).optional(),
  department: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'Invalid department ID format'
    }),
  phone: Joi.string().trim().allow('').optional(),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  createUserSchema,
  updateUserSchema
};
