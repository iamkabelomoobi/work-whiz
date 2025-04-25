import Joi from 'joi';

const textFieldPattern = /^[a-zA-Z0-9\s\-.,:;!?()'"@#$%&*+/=<>[\]{}|\\^~`]+$/;
const htmlTagPattern = /<[^>]*>/;

const validationMessages = {
  string: {
    base: 'must be a string',
    empty: 'cannot be empty',
    required: 'is required',
    pattern: {
      base: 'contains invalid characters',
      specialChars:
        'should only contain letters, numbers, and standard punctuation',
      noHtml: 'HTML tags are not allowed',
    },
  },
  array: {
    base: 'must be an array',
    items: 'contains invalid items',
  },
  date: {
    base: 'must be a valid date',
    iso: 'must be in ISO format (YYYY-MM-DD)',
  },
  boolean: {
    base: 'must be true or false',
  },
  number: {
    base: 'must be a number',
    integer: 'must be an integer',
  },
};

export const jobCreateSchema = Joi.object({
  title: Joi.string()
    .required()
    .pattern(textFieldPattern)
    .pattern(htmlTagPattern, { invert: true })
    .messages({
      'string.pattern.base': validationMessages.string.pattern.specialChars,
      'string.pattern.invert.base': validationMessages.string.pattern.noHtml,
      'string.empty': validationMessages.string.empty,
      'any.required': validationMessages.string.required,
    }),

  description: Joi.string()
    .required()
    .pattern(textFieldPattern)
    .pattern(htmlTagPattern, { invert: true })
    .messages({
      'string.pattern.base': validationMessages.string.pattern.specialChars,
      'string.pattern.invert.base': validationMessages.string.pattern.noHtml,
      'string.empty': validationMessages.string.empty,
      'any.required': validationMessages.string.required,
    }),

  responsibility: Joi.string()
    .required()
    .pattern(textFieldPattern)
    .pattern(htmlTagPattern, { invert: true })
    .messages({
      'string.pattern.base': validationMessages.string.pattern.specialChars,
      'string.pattern.invert.base': validationMessages.string.pattern.noHtml,
      'string.empty': validationMessages.string.empty,
      'any.required': validationMessages.string.required,
    }),

  requirements: Joi.array()
    .items(
      Joi.string()
        .pattern(textFieldPattern)
        .pattern(htmlTagPattern, { invert: true })
        .messages({
          'string.pattern.base': validationMessages.string.pattern.specialChars,
          'string.pattern.invert.base':
            validationMessages.string.pattern.noHtml,
        }),
    )
    .required()
    .messages({
      'array.base': validationMessages.array.base,
      'array.includesRequiredUnknowns': validationMessages.array.items,
      'any.required': validationMessages.string.required,
    }),

  benefits: Joi.array()
    .items(
      Joi.string()
        .pattern(textFieldPattern)
        .pattern(htmlTagPattern, { invert: true })
        .messages({
          'string.pattern.base': validationMessages.string.pattern.specialChars,
          'string.pattern.invert.base':
            validationMessages.string.pattern.noHtml,
        }),
    )
    .required()
    .messages({
      'array.base': validationMessages.array.base,
      'array.includesRequiredUnknowns': validationMessages.array.items,
      'any.required': validationMessages.string.required,
    }),

  location: Joi.string().required().messages({
    'string.empty': validationMessages.string.empty,
    'any.required': validationMessages.string.required,
  }),

  type: Joi.string()
    .valid('Full-time', 'Part-time', 'Contract', 'Internship')
    .required()
    .messages({
      'any.only':
        'must be one of Full-time, Part-time, Contract, or Internship',
      'any.required': validationMessages.string.required,
    }),

  vacancy: Joi.number().integer().min(1).optional().messages({
    'number.base': validationMessages.number.base,
    'number.integer': validationMessages.number.integer,
    'number.min': 'must be at least 1',
  }),

  deadline: Joi.date().iso().min('now').required().messages({
    'date.base': validationMessages.date.base,
    'date.iso': validationMessages.date.iso,
    'date.min': 'must be in the future',
    'any.required': validationMessages.string.required,
  }),

  tags: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[a-zA-Z0-9\s-]+$/)
        .messages({
          'string.pattern.base':
            'should only contain letters, numbers, spaces, and hyphens',
        }),
    )
    .max(10)
    .required()
    .messages({
      'array.base': validationMessages.array.base,
      'array.max': 'cannot have more than 10 tags',
      'any.required': validationMessages.string.required,
    }),

  isPublic: Joi.boolean().optional().messages({
    'boolean.base': validationMessages.boolean.base,
  }),
});

export const jobUpdateSchema = jobCreateSchema
  .fork(Object.keys(jobCreateSchema.describe().keys), schema =>
    schema.optional(),
  )
  .min(1);
