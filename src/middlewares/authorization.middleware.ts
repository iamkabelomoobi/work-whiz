import { promisify } from 'util';
import { jwtUtil, logger, responseUtil } from '@work-whiz/utils';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { authenticationMiddleware } from './authentication.middleware';
import { validateInput } from '@work-whiz/validators';
import { IDecodedJwtToken } from '@work-whiz/interfaces';
import { JwtType } from '@work-whiz/types';

abstract class BaseAuthorization {
  /**
   * Validates a JWT token's basic structure and type
   * @param token The JWT token to validate
   * @param expectedType The expected token type
   * @returns Object containing decoded token and validation status
   */
  protected validateToken(
    token: string,
    expectedType: string,
  ): { decoded: IDecodedJwtToken | null; valid: boolean } {
    const decoded = jwtUtil.decode(token) as IDecodedJwtToken;
    const valid = !!decoded && decoded.type === expectedType;
    return { decoded, valid };
  }

  /**
   * Verifies a JWT token's signature and validity
   * @param token The JWT token to verify
   * @param type Expected token type
   * @param role Optional expected role
   * @returns Verified token payload
   */
  protected async verifyToken(
    role: string,
    token: string,
    type: JwtType,
  ): Promise<IDecodedJwtToken> {
    return jwtUtil.verify({ role, token, type });
  }
}

class AuthorizationMiddleware extends BaseAuthorization {
  private static instance: AuthorizationMiddleware;

  private constructor() {
    super();
  }

  public static getInstance(): AuthorizationMiddleware {
    return (
      AuthorizationMiddleware.instance ||
      (AuthorizationMiddleware.instance = new AuthorizationMiddleware())
    );
  }

  /**
   * Authorizes a user based on refresh token
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public isAuthorized = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const refreshToken = req.cookies['refresh_token'];
      if (!refreshToken) {
        return responseUtil.sendError(res, {
          message: 'Missing refresh token',
          statusCode: StatusCodes.UNAUTHORIZED,
          code: 'MISSING_REFRESH_TOKEN',
        });
      }

      const { decoded, valid } = this.validateToken(refreshToken, 'refresh');
      if (!valid || !decoded) {
        return responseUtil.sendError(res, {
          message: 'Invalid refresh token',
          statusCode: StatusCodes.UNAUTHORIZED,
          code: 'INVALID_REFRESH_TOKEN',
        });
      }

      const verified = await this.verifyToken(
        decoded.role,
        refreshToken,
        decoded.type,
      );

      req.app.locals.userId = verified.id;
      next();
    } catch (error) {
      logger.error('Authorization failed:', error);
      responseUtil.sendError(res, {
        message: 'Authorization failed',
        statusCode: StatusCodes.UNAUTHORIZED,
        code: 'AUTHORIZATION_FAILED',
      });
    }
  };

  /**
   * Authorizes employer-only access
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public authorizeEmployer = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Instead of manually wrapping the callback:
      const isAuthenticatedAsync = promisify(
        authenticationMiddleware.isAuthenticated.bind(authenticationMiddleware),
      );

      // Then in your middleware:
      await isAuthenticatedAsync(req, res);

      const user = req.app.locals?.user;

      if (!user) {
        return responseUtil.sendError(res, {
          message: 'User authentication missing',
          statusCode: StatusCodes.UNAUTHORIZED,
          code: 'MISSING_AUTHENTICATION',
        });
      }

      if (!validateInput(user.role, 'employer')) {
        return responseUtil.sendError(res, {
          message: 'Employer role required',
          statusCode: StatusCodes.FORBIDDEN,
          code: 'ROLE_FORBIDDEN',
        });
      }

      req.app.locals.userId = user.id;

      next();
    } catch (error) {
      logger.error('Employer authorization failed:', error);
      responseUtil.sendError(res, {
        message: 'Authorization failed',
        statusCode: StatusCodes.UNAUTHORIZED,
        code: 'AUTHORIZATION_FAILED',
      });
    }
  };

  /**
   * Authorizes password setup
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public authorizePasswordSetup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.handlePasswordOperation(req, res, next, 'password_setup');
  };

  /**
   * Authorizes password reset
   * @param req Express request object
   * @param res Express response object
   * @param next Express next function
   */
  public authorizePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.handlePasswordOperation(req, res, next, 'password_reset');
  };

  /**
   * Handles common password operation logic
   */
  private async handlePasswordOperation(
    req: Request,
    res: Response,
    next: NextFunction,
    tokenType: 'password_setup' | 'password_reset',
  ): Promise<void> {
    try {
      const { password, token } = req.body;

      if (!password || !token) {
        return responseUtil.sendError(res, {
          message: 'Password and token are required',
          statusCode: StatusCodes.BAD_REQUEST,
          code: 'MISSING_CREDENTIALS',
        });
      }

      const { decoded, valid } = this.validateToken(token, tokenType);
      if (!valid || !decoded) {
        return responseUtil.sendError(res, {
          message: `Invalid ${tokenType.replace('_', ' ')} token`,
          statusCode: StatusCodes.UNAUTHORIZED,
          code: 'INVALID_TOKEN',
        });
      }

      const verified = await this.verifyToken(
        decoded.role,
        token,
        decoded.type,
      );

      req.app.locals.userId = verified.id;
      next();
    } catch (error) {
      logger.error(`${tokenType} authorization failed:`, error);
      responseUtil.sendError(res, {
        message: 'Authorization failed',
        statusCode: StatusCodes.UNAUTHORIZED,
        code: 'AUTHORIZATION_FAILED',
      });
    }
  }
}

export const authorizationMiddleware = AuthorizationMiddleware.getInstance();
