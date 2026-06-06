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
    } catch (error: unknown) {
      console.error(`[Service Error] ${method}:`, error);

      if (error instanceof ServiceError) throw error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'An unexpected error occurred.',
        trace: {
          method,
          context: {
            error: errorMessage,
            stack: errorStack,
          },
        },
      });
    }
  }
}
