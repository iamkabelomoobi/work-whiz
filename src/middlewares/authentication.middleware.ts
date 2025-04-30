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

  /**
   * Extracts and validates token from request headers
   * @private
   * @param {Request} req - Express request object
   * @returns {string} The extracted token
   * @throws {Object} Error object if token is missing or malformed
   */
  private extractToken(req: Request): string {
    const authHeader = req.headers['authorization'] as string;

    if (!authHeader) {
      throw {
        code: 'MISSING_AUTH_HEADER',
        message: "Authorization header required ('Bearer <TOKEN>')",
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw {
        code: 'INVALID_AUTH_FORMAT',
        message: "Invalid format. Use 'Bearer <TOKEN>'",
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    return parts[1];
  }

  /**
   * Validates the decoded token structure
   * @private
   * @param {string} token - The JWT token
   * @returns {DecodedToken} The decoded token
   * @throws {Object} Error object if token is invalid
   */
  private validateToken(token: string): DecodedToken {
    const decodedToken = jwtUtil.decode(token) as DecodedToken;

    if (!decodedToken || !validateInput(decodedToken?.type, 'access')) {
      throw {
        code: 'INVALID_TOKEN_TYPE',
        message: 'Invalid token type',
        statusCode: StatusCodes.UNAUTHORIZED,
      };
    }

    return decodedToken;
  }

  /**
   * Verifies the JWT token
   * @private
   * @param {string} token - The JWT token
   * @param {DecodedToken} decodedToken - The decoded token
   * @returns {Promise<any>} The verified token payload
   * @throws {Object} Error object if verification fails
   */
  private async verifyToken(
    token: string,
    decodedToken: DecodedToken,
  ): Promise<any> {
    try {
      return await jwtUtil.verify({
        token,
        type: 'access',
        role: decodedToken.role,
      });
    } catch (error) {
      console.error(error)
      if (error.name === 'TokenExpiredError') {
        throw {
          code: 'TOKEN_EXPIRED',
          message: 'Access token expired',
          statusCode: StatusCodes.UNAUTHORIZED,
          originalError: error,
        };
      }
      throw {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: 'Token verification failed',
        statusCode: StatusCodes.UNAUTHORIZED,
        originalError: error,
      };
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
      const token = this.extractToken(req);
      const decodedToken = this.validateToken(token);
      const verifiedToken = await this.verifyToken(token, decodedToken);

      req.app.locals.user = verifiedToken;
      next();
    } catch (error) {
      this.handleError(error, res);
    }
  };
}

export const authenticationMiddleware = AuthenticationMiddleware.getInstance();
