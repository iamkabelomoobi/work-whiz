import Joi from 'joi';

const textFieldPattern = /^[a-zA-Z0-9\s\-.,:;!?()'"@#$%&*+/=<>[\]{}|\\^~`]+$/;
const htmlTagPattern = /<[^>]*>/;

export const jobCreateSchema = Joi.object({
  title: Joi.string()
    .required()
    .pattern(textFieldPattern)
    .pattern(htmlTagPattern, { invert: true })
    .messages({
      'string.pattern.base': 'Title contains invalid characters.',
      'string.pattern.invert.base': 'Title must not contain HTML tags.',
      'string.empty': 'Title is required and cannot be empty.',
      'any.required': 'Title is a required field.',
    }),

  description: Joi.string()
    .required()
    .pattern(textFieldPattern)
    .pattern(htmlTagPattern, { invert: true })
    .messages({
      'string.pattern.base': 'Description contains invalid characters.',
      'string.pattern.invert.base': 'Description must not contain HTML tags.',
      'string.empty': 'Description is required and cannot be empty.',
      'any.required': 'Description is a required field.',
    }),

  responsibilities: Joi.array()
    .items(
      Joi.string()
        .pattern(textFieldPattern)
        .pattern(htmlTagPattern, { invert: true })
        .messages({
          'string.pattern.base':
            'Each responsibility contains invalid characters.',
          'string.pattern.invert.base':
            'Each responsibility must not contain HTML tags.',
        }),
    )
    .required()
    .messages({
      'array.base': 'Responsibilities must be an array of strings.',
      'array.includesRequiredUnknowns':
        'Responsibilities must only contain valid strings.',
      'any.required': 'Responsibilities is a required field.',
    }),

  requirements: Joi.array()
    .items(
      Joi.string()
        .pattern(textFieldPattern)
        .pattern(htmlTagPattern, { invert: true })
        .messages({
          'string.pattern.base':
            'Each requirement contains invalid characters.',
          'string.pattern.invert.base':
            'Each requirement must not contain HTML tags.',
        }),
    )
    .required()
    .messages({
      'array.base': 'Requirements must be an array of strings.',
      'array.includesRequiredUnknowns':
        'Requirements must only contain valid strings.',
      'any.required': 'Requirements is a required field.',
    }),

  benefits: Joi.array()
    .items(
      Joi.string()
        .pattern(textFieldPattern)
        .pattern(htmlTagPattern, { invert: true })
        .messages({
          'string.pattern.base': 'Each benefit contains invalid characters.',
          'string.pattern.invert.base':
            'Each benefit must not contain HTML tags.',
        }),
    )
    .required()
    .messages({
      'array.base': 'Benefits must be an array of strings.',
      'array.includesRequiredUnknowns':
        'Benefits must only contain valid strings.',
      'any.required': 'Benefits is a required field.',
    }),

  location: Joi.string().required().messages({
    'string.empty': 'Location is required and cannot be empty.',
    'any.required': 'Location is a required field.',
  }),

  type: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Internship')
    .required()
    .messages({
      'any.only':
        'Type must be one of Full-time, Part-time, Contract, or Internship.',
      'any.required': 'Type is a required field.',
    }),

  vacancy: Joi.number().integer().min(1).optional().messages({
    'number.base': 'Vacancy must be a number.',
    'number.integer': 'Vacancy must be an integer.',
    'number.min': 'Vacancy must be at least 1.',
  }),

  deadline: Joi.date().iso().min('now').required().messages({
    'date.base': 'Deadline must be a valid date.',
    'date.iso': 'Deadline must be in ISO format.',
    'date.min': 'Deadline must be in the future.',
    'any.required': 'Deadline is a required field.',
  }),

  tags: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-zA-Z0-9\s-]+$/)
        .messages({
          'string.pattern.base':
            'Each tag should only contain letters, numbers, spaces, and hyphens.',
        }),
    )
    .max(10)
    .required()
    .messages({
      'array.base': 'Tags must be an array of strings.',
      'array.max': 'Tags cannot have more than 10 items.',
      'any.required': 'Tags is a required field.',
    }),

  isPublic: Joi.boolean().optional().messages({
    'boolean.base': 'isPublic must be a boolean value.',
  }),
});

export const jobUpdateSchema = jobCreateSchema
  .fork(Object.keys(jobCreateSchema.describe().keys), schema =>
    schema.optional(),
  )
  .min(1);
