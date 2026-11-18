const Joi = require('joi');
const { STATUSES } = require('../utils/constants');

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(STATUSES))
    .required()
    .messages({
      'any.only': 'Invalid target status',
      'any.required': 'Target status is required'
    }),
  remark: Joi.string().trim().min(3).max(1000).required().messages({
    'string.empty': 'A remark is mandatory when updating grievance status',
    'string.min': 'Remark must be at least 3 characters',
    'string.max': 'Remark cannot exceed 1000 characters',
    'any.required': 'A remark is mandatory when updating grievance status'
  })
});

const assignGrievanceSchema = Joi.object({
  department: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid department ID format'
    }),
  assignedOfficer: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null)
    .optional()
    .messages({
      'string.pattern.base': 'Invalid assigned officer ID format'
    })
}).min(1).messages({
  'object.min': 'At least one of department or assignedOfficer must be provided'
});

const addCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required().messages({
    'string.empty': 'Comment text is required',
    'string.min': 'Comment text must be at least 1 character',
    'string.max': 'Comment text cannot exceed 1000 characters',
    'any.required': 'Comment text is required'
  }),
  isInternal: Joi.boolean().optional()
});

const feedbackSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required().messages({
    'number.base': 'Rating must be a number between 1 and 5',
    'number.min': 'Rating must be at least 1',
    'number.max': 'Rating cannot exceed 5',
    'any.required': 'Rating is required'
  }),
  comment: Joi.string().trim().allow('').max(1000).optional()
});

const reopenSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(1000).required().messages({
    'string.empty': 'A reason is required to reopen a grievance',
    'string.min': 'Reason must be at least 3 characters',
    'string.max': 'Reason cannot exceed 1000 characters',
    'any.required': 'A reason is required to reopen a grievance'
  })
});

module.exports = {
  updateStatusSchema,
  assignGrievanceSchema,
  addCommentSchema,
  feedbackSchema,
  reopenSchema
};
