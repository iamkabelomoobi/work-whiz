import { IAdmin } from '../models';
import { IAdminQuery, IPaginationQueryOptions } from '../queries';

export interface IAdminService {
  /**
   * Find a single admin matching the query criteria
   */
  findOne: (query: IAdminQuery) => Promise<IAdmin | null>;

  /**
   * Find all admins matching the query criteria with pagination
   */
  findAll: (
    query: IAdminQuery,
    options?: IPaginationQueryOptions,
  ) => Promise<{
    admins: IAdmin[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;

  /**
   * Update an admin by ID
   */
  update: (id: string, data: Partial<IAdmin>) => Promise<{ message: string }>;
}
