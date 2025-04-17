import { Transaction } from 'sequelize';
import { IAdmin, IAdminQuery } from '@work-whiz/interfaces';

export interface IAdminRepository {
  create(user: Omit<IAdmin, 'id'>): Promise<IAdmin>;
  read(query: IAdminQuery): Promise<IAdmin | null>;
  readAll(
    query: IAdminQuery,
    options: {
      page: number;
      limit: number;
      sort?: Record<string, 'ASC' | 'DESC'>;
    },
  ): Promise<{ admins: IAdmin[]; total: number }>;
  update(id: string, data: Partial<IAdmin>): Promise<IAdmin | null>;

  withTransaction(t: Transaction): IAdminRepository;
}
