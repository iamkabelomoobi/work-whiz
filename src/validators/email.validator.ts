import { emailSchema } from './schemas/email.schema';

export const emailValidator = (email: string) => {
  const { error } = emailSchema.validate(email, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
