import Joi from 'joi';
import { baseRegisterSchema } from './base-register.schema';

export const candidateRegisterSchema = baseRegisterSchema.keys({
  title: Joi.string().required().messages({
    'string.base': 'Title should be a string',
    'string.empty': 'Title cannot be empty',
    'string.required': 'Title is required',
  }),
});
