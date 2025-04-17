import { StatusCodes } from 'http-status-codes';

interface ISuccessResponse<T> {
  status: 'success';
  data: T;
  meta?: {
    [key: string]: unknown;
  };
}

interface IErrorResponse {
  status: 'error';
  statusCode: StatusCodes;
  error: { message: string };
  details?: {
    [key: string]: unknown;
  };
  timestamp?: string;
}

export { ISuccessResponse, IErrorResponse };
