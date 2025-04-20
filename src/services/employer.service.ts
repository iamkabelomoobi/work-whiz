import { ServiceError } from '@work-whiz/errors';
import {
  IEmployer,
  IEmployerQuery,
  IEmployerService,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { employerRepository } from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';

class EmployerService implements IEmployerService {
  private static instance: EmployerService;

  private constructor() {
    // Private constructor to enforce singleton pattern
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
   * Handles method-level error capturing and standardizes service error formatting.
   * @template T
   * @param {() => Promise<T>} fn - The asynchronous function to execute
   * @param {string} method - Name of the calling method for trace context
   * @returns {Promise<T>} The resolved value from the passed function
   * @throws {ServiceError} Standardized error object
   */
  private async handleErrors<T>(
    fn: () => Promise<T>,
    method: string,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error instanceof ServiceError) throw error;

      // Optional: console.error in development
      // console.error(`[${method}] Unexpected Error:`, error);

      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'An unexpected error occurred.',
        trace: {
          method,
          context: {
            error: error?.message || error,
            stack: error?.stack,
          },
        },
      });
    }
  }

  /**
   * Retrieves a single employer based on the provided query.
   * @param {IEmployerQuery} query - Employer identification criteria
   * @returns {Promise<IEmployer>} The matched employer object
   * @throws {ServiceError} If no employer is found
   */
  public async findOne(query: IEmployerQuery): Promise<IEmployer> {
    return this.handleErrors(async () => {
      const employer = await employerRepository.read(query);

      if (!employer) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Employer account not found.',
          trace: { method: this.findOne.name, context: { query } },
        });
      }

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

      return { message: 'Employer account updated successfully.' };
    }, this.update.name);
  }
}

export const employerService = EmployerService.getInstance();
