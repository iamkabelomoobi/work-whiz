import Joi from 'joi';

export const employerSchema = Joi.object({
  name: Joi.string().optional().messages({
    'string.base': 'Company name should be a string',
    'string.empty': 'Company name cannot be empty',
  }),
  industry: Joi.string().optional().messages({
    'string.base': 'Industry should be a string',
    'string.empty': 'Industry cannot be empty',
    'string.pattern.base': 'Industry can only contain letters',
  }),
  websiteUrl: Joi.string().optional().uri().messages({
    'string.base': 'Website URL should be a string',
    'string.empty': 'Website URL cannot be empty',
    'string.uri': 'Website URL must be a valid URL',
  }),
  location: Joi.string().optional().messages({
    'string.base': 'Location should be a string',
    'string.empty': 'Location cannot be empty',
  }),
  description: Joi.string().optional().messages({
    'string.base': 'Description should be a string',
    'string.empty': 'Description cannot be empty',
  }),
  size: Joi.number().optional().integer().min(1).messages({
    'number.base': 'Size should be a number',
    'number.integer': 'Size should be an integer',
    'number.min': 'Size should be at least 1',
  }),
  foundedIn: Joi.number()
    .optional()
    .integer()
    .min(1800)
    .max(new Date().getFullYear())
    .messages({
      'number.base': 'Founded year should be a number',
      'number.integer': 'Founded year should be an integer',
      'number.min': 'Founded year should be at least 1800',
      'number.max': `Founded year cannot be in the future`,
    }),
});
