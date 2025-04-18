import { phoneSchema } from './schemas/phone.schema';

export const phoneValidator = (phone: string) => {
  const { error } = phoneSchema.validate(phone, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
