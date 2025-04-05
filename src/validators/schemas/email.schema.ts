import Joi from "joi";

const BLOCKED_TLDS_DOMAINS = ['protonmail.com', 'pront.me', 'tutanota.io'];

export const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .required()
  .custom((value, helpers) => {
    const domain = value.split('@')[1]?.toLowerCase();
    if (BLOCKED_TLDS_DOMAINS.includes(domain)) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "string.email": "Please enter a valid email address.",
    "any.required": "Email is required and cannot be empty.",
    "string.empty": "Email cannot be just spaces or empty.",
    "any.invalid": "We currently do not accept emails from that provider.",
  });
