import {
  IApplication,
  IApplicationQuery,
  IPaginatedApplications,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface IApplicationService {
  createApplication: (
    userId: string,
    application: Omit<IApplication, 'id'>,
  ) => Promise<{ message: string; application: IApplication }>;
  findApplication: (applicationId: string) => Promise<IApplication>;
  findApplications: (
    query: IApplicationQuery,
    options: IPaginationQueryOptions,
  ) => Promise<IPaginatedApplications>;
  updateApplication: (
    applicationId: string,
    data: Partial<IApplication>,
  ) => Promise<{ message: string; application: IApplication }>;
  deleteApplication: (applicationId: string) => Promise<{ message: string }>;
}
