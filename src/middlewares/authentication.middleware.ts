/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { responseUtil, jwtUtil } from '@work-whiz/utils';
import { validateInput } from '@work-whiz/validators';

interface DecodedToken {
  type: string;
  role?: string;
  [key: string]: any;
}

/**
 * Authentication middleware handling JWT verification and token refresh
 * @class AuthenticationMiddleware
 */
class AuthenticationMiddleware {
  private static instance: AuthenticationMiddleware;

  private async getVerifiedToken(req: Request): Promise<any> {
    const authHeader = req.headers['authorization'] as string;
    if (!authHeader) {
      this.handleError(
        {
          code: 'NO_AUTH_HEADER',
          message: 'Authorization header is missing',
          statusCode: StatusCodes.UNAUTHORIZED,
        },
        req.res,
      );
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      this.handleError(
        {
          code: 'INVALID_AUTH_FORMAT',
          message: "Invalid format. Use 'Bearer <TOKEN>'",
          statusCode: StatusCodes.UNAUTHORIZED,
        },
        req.res,
      );
    }

    const token = parts[1];
    const decodedToken = jwtUtil.decode(token) as DecodedToken;
    if (!decodedToken || !validateInput(decodedToken?.type, 'access')) {
      this.handleError(
        {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Invalid token type',
          statusCode: StatusCodes.UNAUTHORIZED,
        },
        req.res,
      );
    }

    try {
      return await jwtUtil.verify({
        token,
        type: 'access',
        role: decodedToken.role,
      });
    } catch (error) {
      console.error(error);
      this.handleError(
        {
          code:
            error.name === 'TokenExpiredError'
              ? 'TOKEN_EXPIRED'
              : 'TOKEN_VERIFICATION_FAILED',
          message:
            error.name === 'TokenExpiredError'
              ? 'Access token expired'
              : 'Token verification failed',
          statusCode: StatusCodes.UNAUTHORIZED,
          originalError: error,
        },
        req.res,
      );
    }
  }

  /**
   * Handles authentication errors
   * @private
   * @param {any} error - The error object
   * @param {Response} res - Express response object
   */
  private handleError(error: any, res: Response): void {
    const response = {
      message: error.message || 'Authentication failed',
      statusCode: error.statusCode || StatusCodes.UNAUTHORIZED,
      code: error.code || 'AUTH_FAILED',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.originalError?.message,
      }),
    };

    responseUtil.sendError(res, response);
  }

  private constructor() {
    //
  }

  /**
   * Get singleton instance of AuthenticationMiddleware
   * @returns {AuthenticationMiddleware} The singleton instance
   */
  public static getInstance(): AuthenticationMiddleware {
    return (
      AuthenticationMiddleware.instance ||
      (AuthenticationMiddleware.instance = new AuthenticationMiddleware())
    );
  }

  /**
   * Main authentication middleware that verifies JWT tokens
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next function
   * @returns {Promise<void>}
   */
  public isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const verifiedToken = await this.getVerifiedToken(req);
      req.app.locals.user = verifiedToken;
      next();
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const authenticationMiddleware = AuthenticationMiddleware.getInstance();
