/**
 *
 *
 *
 */
import { candidateRegisterSchema } from './schemas/candidate-register.schema';

export const candidateRegisterValidator = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) => {
  const { error } = candidateRegisterSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
