import Joi from 'joi';
import { emailSchema } from './email.schema';
import { phoneSchema } from './phone.schema';

export const baseRegisterSchema = Joi.object({
  email: emailSchema,
  phone: phoneSchema,
});
