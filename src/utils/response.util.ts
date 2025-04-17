/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from './logger';
import { ISuccessResponse, IErrorResponse } from '@work-whiz/interfaces';

class ResponseUtil {
  private static instance: ResponseUtil;

  private constructor() {
    //
  }

  public static getInstance = (): ResponseUtil => {
    if (!ResponseUtil.instance) {
      ResponseUtil.instance = new ResponseUtil();
    }
    return ResponseUtil.instance;
  };

  public sendSuccess<T>(
    res: Response,
    data: T,
    statusCode: StatusCodes = StatusCodes.OK,
    meta?: Record<string, unknown>,
  ): void {
    const response: ISuccessResponse<T> = {
      status: 'success',
      data,
      ...(meta && { meta }),
    };

    res.status(statusCode).json(response);
  }

  public sendError(
    res: Response,
    error: unknown,
    statusCode?: StatusCodes,
  ): void {
    const normalizedError = this.normalizeError(error);
    const code =
      statusCode ||
      normalizedError.statusCode ||
      StatusCodes.INTERNAL_SERVER_ERROR;
    const shouldLog = code >= StatusCodes.INTERNAL_SERVER_ERROR;

    const response: IErrorResponse = {
      status: 'error',
      statusCode,
      error: { message: normalizedError.message },
      ...(normalizedError.details && { details: normalizedError.details }),
      timestamp: new Date().toISOString(),
    };

    if (shouldLog) {
      logger.error({
        ...response,
        stack: normalizedError.stack,
      });
    } else {
      logger.warn(response);
    }

    res.status(code).json(response);
  }
  private normalizeError(error: unknown): {
    message: string;
    statusCode?: StatusCodes;
    details?: Record<string, unknown>;
    stack?: string;
  } {
    if (error instanceof Error) {
      return {
        message: error.message,
        ...('statusCode' in error && { statusCode: (error as any).statusCode }),
        ...('details' in error && { details: (error as any).details }),
        stack: error.stack,
      };
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      return {
        message: String((error as any).message),
        ...('statusCode' in error && { statusCode: (error as any).statusCode }),
        ...('details' in error && { details: (error as any).details }),
      };
    }

    return {
      message: String(error),
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    };
  }
}

export const responseUtil = ResponseUtil.getInstance();
