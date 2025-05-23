import { logger } from './logger';
import { Response } from 'express';

type NormalizedError = {
  status?: 'error';
  statusCode: number;
  message: string;
  details?: Record<string, unknown>;
  code?: string; // Made optional here
};

class ResponseUtil {
  public sendSuccess<T>(
    response: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
  ) {
    const payload = {
      status: 'success',
      statusCode,
      data,
      message,
      timestamp: new Date().toISOString(),
    };

    logger.info({
      status: 'success',
      statusCode,
      message,
      timestamp: payload.timestamp,
    });

    response.status(statusCode).json(payload);
  }

  public sendError(
    response: Response,
    error: Error | (NormalizedError & { code?: string }),
  ) {
    const normalizedError: NormalizedError & { code?: string } =
      'status' in error
        ? error
        : {
            status: 'error',
            statusCode: 500,
            message: error.message,
          };

    const sanitizedMessage = this.sanitizeMessage(normalizedError.message);
    const sanitizedDetails = normalizedError.details
      ? this.sanitizeDetails(normalizedError.details)
      : undefined;

    const payload = {
      status: 'error',
      statusCode: normalizedError.statusCode,
      error: {
        message: sanitizedMessage,
        ...(normalizedError.code && { code: normalizedError.code }), // Only include if exists
      },
      ...(sanitizedDetails && { details: sanitizedDetails }),
      timestamp: new Date().toISOString(),
    };

    logger.error({
      status: payload.status,
      statusCode: payload.statusCode,
      timestamp: payload.timestamp,
      error: {
        message: error.message || 'Error occurred',
        ...(normalizedError.code && { code: normalizedError.code }),
      },
      ...(sanitizedDetails && { details: sanitizedDetails }),
    });
    response.status(normalizedError.statusCode).json(payload);
  }

  private sanitizeMessage(message: string): string {
    const sensitivePatterns = [
      /password/i,
      /email/i,
      /\bssn\b/i,
      /\bcredit card\b/i,
      /token/i,
      /key/i,
    ];
    for (const pattern of sensitivePatterns) {
      if (pattern.test(message)) {
        return message;
      }
    }
    return message;
  }

  private sanitizeDetails(
    details: Record<string, unknown>,
  ): Record<string, unknown> {
    const sanitizedDetails: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(details)) {
      if (typeof value === 'string') {
        sanitizedDetails[key] = this.sanitizeMessage(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitizedDetails[key] = this.sanitizeDetails(
          value as Record<string, unknown>,
        );
      } else {
        sanitizedDetails[key] = value;
      }
    }
    return sanitizedDetails;
  }
}

export const responseUtil = new ResponseUtil();
