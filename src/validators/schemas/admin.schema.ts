import Joi from 'joi';

export const adminSchema = Joi.object({
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
});
