const Joi = require('joi');

const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Department name is required',
    'string.min': 'Department name must be at least 2 characters',
    'string.max': 'Department name cannot exceed 100 characters',
    'any.required': 'Department name is required'
  }),
  description: Joi.string().trim().allow('').optional(),
  categoriesHandled: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .min(1)
    .unique()
    .required()
    .messages({
      'array.min': 'At least one category must be handled by this department',
      'array.unique': 'Categories must be unique within a department',
      'any.required': 'Categories handled are required'
    })
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional().messages({
    'string.min': 'Department name must be at least 2 characters',
    'string.max': 'Department name cannot exceed 100 characters'
  }),
  description: Joi.string().trim().allow('').optional(),
  categoriesHandled: Joi.array()
    .items(Joi.string().trim().min(2).max(50))
    .min(1)
    .unique()
    .optional()
    .messages({
      'array.min': 'At least one category must be handled by this department',
      'array.unique': 'Categories must be unique within a department'
    }),
  isActive: Joi.boolean().optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema
};
