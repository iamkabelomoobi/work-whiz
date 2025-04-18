import { StatusCodes } from 'http-status-codes';
import { IServiceErrorDetails } from '@work-whiz/interfaces';
import { logger } from '@work-whiz/utils/logger';

export class ControllerError extends Error {
  public readonly statusCode: number;
  public readonly details: IServiceErrorDetails;
  public readonly timestamp: Date;
  public readonly shouldLog: boolean;

  constructor(statusCode: number, details: IServiceErrorDetails | string) {
    const normalizedDetails: IServiceErrorDetails =
      typeof details === 'string' ? { message: details } : details;

    super(normalizedDetails.message);
    this.name = 'ControllerError';
    this.statusCode = statusCode;
    this.timestamp = new Date();
    this.shouldLog = this.determineIfShouldLog(statusCode);

    this.details = {
      ...normalizedDetails,
      trace: {
        stack: this.stack,
        ...normalizedDetails.trace,
      },
    };

    if (this.shouldLog) {
      this.logError();
    }

    Object.setPrototypeOf(this, ControllerError.prototype);
  }

  private determineIfShouldLog(statusCode: number): boolean {
    // Log all server errors and selected client errors
    return (
      statusCode >= StatusCodes.INTERNAL_SERVER_ERROR ||
      [
        StatusCodes.TOO_MANY_REQUESTS,
        StatusCodes.UNAUTHORIZED,
        StatusCodes.FORBIDDEN,
      ].includes(statusCode)
    );
  }

  private logError(): void {
    const logData = {
      statusCode: this.statusCode,
      message: this.message,
      timestamp: this.timestamp,
      stack: this.stack,
      details: this.details,
    };

    if (this.statusCode >= StatusCodes.INTERNAL_SERVER_ERROR) {
      logger.error('Controller Error', logData);
    } else {
      logger.warn('Controller Warning', logData);
    }
  }

  public toJSON() {
    return {
      name: this.name,
      statusCode: this.statusCode,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
      details: this.details,
    };
  }

  public static fromError(
    statusCode: number,
    error: unknown,
    additionalInfo?: Omit<IServiceErrorDetails, 'message' | 'originalError'>,
  ): ControllerError {
    const message = error instanceof Error ? error.message : String(error);

    return new ControllerError(statusCode, {
      message,
      originalError: error,
      ...additionalInfo,
    });
  }
}
