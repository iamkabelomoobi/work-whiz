/**
 *
 *
 *
 */
import { IEmployerRegister } from '@work-whiz/interfaces';
import { employerRegisterSchema } from './schemas/employer-register.schema';

export const employerRegisterValidator = (data: IEmployerRegister) => {
  const { error } = employerRegisterSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
