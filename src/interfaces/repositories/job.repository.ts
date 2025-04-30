import { Transaction } from 'sequelize';
import {
  IJob,
  IJobQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface IJobRepository {
  create(job: Omit<IJob, 'id'>): Promise<IJob | null>;
  read(query: IJobQuery): Promise<IJob>;
  readAll(
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    jobs: IJob[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }>;
  update(id: string, data: Partial<IJob>): Promise<IJob>;
  delete(id: string): Promise<boolean>;

  withTransaction(t: Transaction): IJobRepository;
}
