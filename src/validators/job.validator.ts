import { IJob } from '@work-whiz/interfaces';
import { jobCreateSchema, jobUpdateSchema } from './schemas/job.schema';

export const validateJob = (jobData: Partial<IJob>, isUpdate?: boolean) => {
  const options = {
    abortEarly: false,
  };
  const { error } = !isUpdate
    ? jobCreateSchema.validate(jobData, options)
    : jobUpdateSchema.validate(jobData, options);

  if (error) {
    return error;
  }
};
