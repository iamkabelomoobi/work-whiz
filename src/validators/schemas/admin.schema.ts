import Joi from 'joi';

export const adminSchema = Joi.object({
  permissions: Joi.array().items(Joi.string()).optional().messages({
    'array.base': 'Permissions should be an array of strings',
    'string.base': 'Each permission should be a string',
  }),
});
