import { IEmployer } from '@work-whiz/interfaces';
import { employerSchema } from './schemas/employer.schema';

export const employerValidator = (employer: Partial<IEmployer>) => {
  const { error } = employerSchema.validate(employer, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
