import { StatusCodes } from 'http-status-codes';
import { ServiceError } from '@work-whiz/errors';

/**
 * Base service class providing shared utilities for all services.
 */
export class BaseService {
  /**
   * Handles unexpected service errors with contextual tracing.
   * @template T - Return type of the wrapped function.
   * @param fn - The asynchronous function to wrap.
   * @param method - Name of the service method (used for trace context).
   * @returns The result of the function or throws a standardized ServiceError.
   */
  protected async handleErrors<T>(
    fn: () => Promise<T>,
    method: string,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      console.error(`[Service Error] ${method}:`, error);

      if (error instanceof ServiceError) throw error;

      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'An unexpected error occurred.',
        trace: {
          method,
          context: {
            error: error.message,
            stack: error.stack,
          },
        },
      });
    }
  }
}
