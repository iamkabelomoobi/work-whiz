import { IJob } from '@work-whiz/interfaces';
import { jobCreateSchema, jobUpdateSchema } from './schemas/job.schema';

export const validateJob = (jobData: Partial<IJob>, isUpdate?: boolean) => {
  const options = {
    abortEarly: false,
  };
  const { error } = isUpdate
    ? jobUpdateSchema.validate(jobData, options)
    : jobCreateSchema.validate(jobData, options);

  if (error) {
    return error;
  }
};
