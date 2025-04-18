/**
 *
 *
 *
 */
import { IAdminRegister } from '@work-whiz/interfaces';
import { adminRegisterSchema } from './schemas/admin-register.schema';

export const adminRegisterValidator = (data: IAdminRegister) => {
  const { error } = adminRegisterSchema.validate(data, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
