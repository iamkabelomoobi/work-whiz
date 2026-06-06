/**
 *
 *
 *
 */
import { candidateRegisterSchema } from './schemas/candidate-register.schema';

export const candidateRegisterValidator = (data: {
  name: string;
  email: string;
  phone: string;
  password: string;
  title: string;
}) => {
  const { error } = candidateRegisterSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
