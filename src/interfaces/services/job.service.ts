import {
  IJob,
  IJobQuery,
  IPaginatedJobs,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface IJobService {
  createJob: (
    userId: string,
    job: Omit<IJob, 'id'>,
  ) => Promise<{ message: string; job: IJob }>;
  findJob: (query: IJobQuery) => Promise<IJob>;
  findJobs: (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ) => Promise<IPaginatedJobs>;
  updateJob: (
    jobId: string,
    data: Partial<IJob>,
  ) => Promise<{ message: string; job: IJob }>;
  deleteJob: (jobId: string) => Promise<{ message: string }>;
}
