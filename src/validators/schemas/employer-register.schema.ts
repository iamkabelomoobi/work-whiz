import Joi from 'joi';
import { baseRegisterSchema } from './base-register.schema';

export const employerRegisterSchema = baseRegisterSchema.keys({
  industry: Joi.string().required().messages({
    'string.base': 'Industry should be a string',
    'string.empty': 'Industry cannot be empty',
    'string.pattern.base': 'Industry can only contain letters',
  }),
});
