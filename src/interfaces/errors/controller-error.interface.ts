import { IServiceErrorDetails } from './service.interface';

export interface IControllerErrorResponse {
  statusCode: number;
  error: {
    message: string;
    serviceName: string;
  };
}

export interface IControllerErrorOptions {
  serviceName: string;
  logData?: Record<string, unknown> | IServiceErrorDetails;
  originalError?: unknown;
}
