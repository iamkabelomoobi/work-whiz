import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const globalErrorHandler = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  err: any,
  req: Request,
  res: Response,
): void => {
  console.error('Global Error:', err);

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
};
