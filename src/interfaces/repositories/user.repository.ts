import { Transaction } from 'sequelize';
import { IUser, IUserQuery } from '@work-whiz/interfaces';

export interface IUserRepository {
  create(user: Omit<IUser, 'id'>): Promise<IUser | null>;
  read(query: IUserQuery): Promise<IUser>;
  readAll(
    query: IUserQuery,
    options: {
      page: number;
      limit: number;
      sort?: Record<string, 'ASC' | 'DESC'>;
    }
  ): Promise<{
    users: IUser[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }>;
  update(id: string, data: Partial<IUser>): Promise<IUser>;
  delete(id: string): Promise<boolean>;

  withTransaction(t: Transaction): IUserRepository;
}
