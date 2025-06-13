import { Transaction } from 'sequelize';
import {
  IApplication,
  IApplicationQuery,
  IPaginatedApplications,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface IApplicationRepository {
  create(application: Omit<IApplication, 'id'>): Promise<IApplication>;
  read(applicationId: string): Promise<IApplication | null>;
  readAll(
    query: IApplicationQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedApplications>;
  update(
    applicationId: string,
    data: Partial<IApplication>,
  ): Promise<IApplication>;
  delete(applicationId: string): Promise<boolean>;

  withTransaction(t: Transaction): IApplicationRepository;
}
