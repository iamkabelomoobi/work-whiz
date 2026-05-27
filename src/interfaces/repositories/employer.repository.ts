import { Prisma } from '@prisma/client';
import {
  IEmployer,
  IEmployerQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface IEmployerRepository {
  create(user: Omit<IEmployer, 'id'>): Promise<IEmployer>;
  read(query: IEmployerQuery): Promise<IEmployer | null>;
  readAll(
    query: IEmployerQuery,
    options: IPaginationQueryOptions,
  ): Promise<{ employers: IEmployer[]; total: number }>;
  update(id: string, data: Partial<IEmployer>): Promise<IEmployer | null>;

  withTransaction(t: Prisma.TransactionClient): IEmployerRepository;
}
