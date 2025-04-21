import Joi from 'joi';

export const candidateSchema = Joi.object({
  firstName: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .optional()
    .messages({
      'string.base': 'First name should be a string',
      'string.empty': 'First name cannot be empty',
      'string.pattern.base': 'First name can only contain letters',
    }),
  lastName: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .optional()
    .messages({
      'string.base': 'Last name should be a string',
      'string.empty': 'Last name cannot be empty',
      'string.pattern.base': 'Last name can only contain letters',
    }),
  title: Joi.string().optional().messages({
    'string.base': 'Title should be a string',
    'string.empty': 'Title cannot be empty',
  }),
  skills: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Skills should be an array of strings',
    'string.base': 'Each skill should be a string',
  }),
  isEmployed: Joi.boolean().optional().messages({
    'boolean.base': 'isEmployed should be a boolean',
  }),
});
