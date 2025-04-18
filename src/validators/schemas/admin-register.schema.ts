import Joi from 'joi';
import { baseRegisterSchema } from './base-register.schema';

export const adminRegisterSchema = baseRegisterSchema.keys({
  firstName: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.base': 'First name should be a string',
      'string.empty': 'First name cannot be empty',
      'string.required': 'First name is required',
      'string.pattern.base': 'First name can only contain letters',
    }),
  lastName: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.base': 'Last name should be a string',
      'string.empty': 'Last name cannot be empty',
      'string.pattern.base': 'Last name can only contain letters',
    }),
});
