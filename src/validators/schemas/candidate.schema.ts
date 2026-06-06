import Joi from 'joi';

export const candidateSchema = Joi.object({
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
