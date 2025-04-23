/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceError } from '@work-whiz/errors';
import {
  IEmployer,
  IEmployerQuery,
  IEmployerService,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { employerRepository } from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';
import { cacheUtil } from '@work-whiz/utils';
import { BaseService } from './base.service';

class EmployerService extends BaseService implements IEmployerService {
  private static instance: EmployerService;

  /**
   * Generates a cache key for the employer based on userId
   * @param {string} userId - The user ID of the employer
   * @returns {string} The generated cache key
   */
  private generateCacheKey = (userId: string): string => {
    return `employer:${userId}`;
  };

  private constructor() {
    super();
  }

  /**
   * Singleton access method.
   * @returns {EmployerService} The single instance of EmployerService
   */
  public static getInstance(): EmployerService {
    if (!EmployerService.instance) {
      EmployerService.instance = new EmployerService();
    }
    return EmployerService.instance;
  }

  /**
   * Retrieves a single employer based on the provided query.
   * @param {IEmployerQuery} query - Employer identification criteria
   * @returns {Promise<IEmployer>} The matched employer object
   * @throws {ServiceError} If no employer is found
   */
  public async findOne(query: IEmployerQuery): Promise<IEmployer> {
    return this.handleErrors(async () => {
      const cacheKey = this.generateCacheKey(query.userId);
      const cachedEmployer = await cacheUtil.get(cacheKey);

      if (cachedEmployer) {
        return cachedEmployer as IEmployer;
      }

      const employer = await employerRepository.read(query);

      if (!employer) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Employer account not found.',
          trace: { method: this.findOne.name, context: { query } },
        });
      }

      await cacheUtil.set(cacheKey, employer, 3600);
      return employer;
    }, this.findOne.name);
  }

  /**
   * Retrieves all employers matching the query with optional pagination.
   * @param {IEmployerQuery} query - Filtering criteria
   * @param {IPaginationQueryOptions} [options] - Pagination options
   * @returns {Promise<{ employers: IEmployer[]; pagination: { page: number; limit: number; total: number } }>}
   * @throws {ServiceError} If no matching employers are found
   */
  public async findAll(
    query: IEmployerQuery,
    options?: IPaginationQueryOptions,
  ): Promise<{
    employers: IEmployer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    return this.handleErrors(async () => {
      const payload = await employerRepository.readAll(query, options);
      if (payload.employers.length === 0) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'No employers found matching the provided criteria.',
          trace: { method: this.findAll.name, context: { query, options } },
        });
      }

      return {
        employers: payload.employers,
        pagination: {
          page: payload.currentPage,
          limit: options?.limit ?? 10,
          total: payload.total,
        },
      };
    }, this.findAll.name);
  }

  /**
   * Updates an employer's account based on the user ID.
   * @param {string} userId - Unique identifier for the employer
   * @param {Partial<IEmployer>} data - The fields to update
   * @returns {Promise<{ message: string }>} Confirmation message
   * @throws {ServiceError} If the employer is not found
   */
  public async update(
    userId: string,
    data: Partial<IEmployer>,
  ): Promise<{ message: string }> {
    return this.handleErrors(async () => {
      const employer = await employerRepository.read({ userId });

      if (!employer) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Employer account not found.',
          trace: { method: this.update.name, context: { userId } },
        });
      }

      await employerRepository.update(userId, data);

      const cacheKey = this.generateCacheKey(employer.userId);
      await cacheUtil.delete(cacheKey);

      return { message: 'Employer account updated successfully.' };
    }, this.update.name);
  }
}

export const employerService = EmployerService.getInstance();
