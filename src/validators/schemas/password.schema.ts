/**
 * @fileoverview
 * @module
 * @version
 */
import Joi from 'joi';

export const passwordSchema = Joi.string()
  .min(12)
  .max(64)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]+$/,
  )
  .required()
  .messages({
    'string.base': 'Password should be alphanumeric with special characters.',
    'string.empty': 'Please enter a password.',
    'any.required': 'Password is required.',
    'string.min': 'Password should be at least 12 characters long.',
    'string.max': 'Password should not exceed 64 characters.',
    'string.pattern.base':
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
  });
