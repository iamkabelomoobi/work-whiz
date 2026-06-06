import Joi from 'joi';
import { emailSchema } from './email.schema';
import { phoneSchema } from './phone.schema';
import { passwordSchema } from './password.schema';

export const baseRegisterSchema = Joi.object({
  name: Joi.string().required().messages({
    'string.base': 'Name should be a string',
    'string.empty': 'Name cannot be empty',
    'any.required': 'Name is required',
    'string.required': 'Name is required',
  }),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});
