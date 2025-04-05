/**
 *
 *
 *
 */
import { adminRegisterSchema } from './schemas/admin-register.schema';

export const adminRegisterValidator = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) => {
  const { error } = adminRegisterSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
