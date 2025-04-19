import { IAdmin } from '@work-whiz/interfaces';
import { adminSchema } from './schemas/admin.schema';

export const adminValidator = (admin: Partial<IAdmin>) => {
  const { error } = adminSchema.validate(admin, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
