/**
 *
 *
 *
 */
import Joi from 'joi';

export const phoneSchema = Joi.string()
  .pattern(/^\+([1-9]{1,4})\d{7,14}$/)
  .required()
  .messages({
    'string.base': 'Phone number is required.',
    'string.empty': 'Phone number cannot be empty.',
    'string.pattern.base':
      'Please enter a valid phone number with country code.',
    'any.required': 'Phone number is required.',
  });
