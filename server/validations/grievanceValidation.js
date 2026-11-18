const Joi = require('joi');
const { PRIORITIES } = require('../utils/constants');

const createGrievanceSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.min': 'Title must be between 5 and 200 characters',
    'string.max': 'Title must be between 5 and 200 characters',
    'any.required': 'Title is required'
  }),
  description: Joi.string().trim().min(10).max(2000).required().messages({
    'string.empty': 'Description is required',
    'string.min': 'Description must be between 10 and 2000 characters',
    'string.max': 'Description must be between 10 and 2000 characters',
    'any.required': 'Description is required'
  }),
  category: Joi.string().trim().required().messages({
    'string.empty': 'Category is required',
    'any.required': 'Category is required'
  }),
  priority: Joi.string()
    .valid(...Object.values(PRIORITIES))
    .default(PRIORITIES.MEDIUM)
    .optional(),
  location: Joi.string().trim().min(3).max(300).required().messages({
    'string.empty': 'Location is required',
    'string.min': 'Location must be at least 3 characters',
    'string.max': 'Location cannot exceed 300 characters',
    'any.required': 'Location is required'
  })
});

module.exports = {
  createGrievanceSchema
};
