import { IEmployer } from '../models';
import { IEmployerQuery, IPaginationQueryOptions } from '../queries';

export interface IEmployerService {
  /**
   * Find a single employer matching the query criteria
   */
  findOne: (query: IEmployerQuery) => Promise<IEmployer | null>;

  /**
   * Find all employers matching the query criteria with pagination
   */
  findAll: (
    query: IEmployerQuery,
    options?: IPaginationQueryOptions,
  ) => Promise<{
    employers: IEmployer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;

  /**
   * Update an employer by ID
   */
  update: (
    id: string,
    data: Partial<IEmployer>,
  ) => Promise<{ message: string }>;
}
