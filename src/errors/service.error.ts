import { IServiceErrorDetails } from '@work-whiz/interfaces';

export class ServiceError extends Error {
  public readonly statusCode: number;
  public readonly details: IServiceErrorDetails;
  public readonly timestamp: Date;

  constructor(statusCode: number, details: IServiceErrorDetails | string) {
    const normalizedDetails: IServiceErrorDetails =
      typeof details === 'string' ? { message: details } : details;

    super(normalizedDetails.message);
    this.name = 'ServiceError';
    this.statusCode = statusCode;
    this.timestamp = new Date();

    this.details = {
      ...normalizedDetails,
      trace: {
        stack: this.stack,
        ...normalizedDetails.trace,
      },
    };

    Object.setPrototypeOf(this, ServiceError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServiceError);
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
  ): ServiceError {
    const message = error instanceof Error ? error.message : String(error);

    return new ServiceError(statusCode, {
      message,
      originalError: error,
      ...additionalInfo,
    });
  }
}
