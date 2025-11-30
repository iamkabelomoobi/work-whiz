import { getUserRole, jwtUtil, responseUtil } from '@work-whiz/utils';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { IDecodedJwtToken } from '@work-whiz/interfaces';

class AuthorizationMiddleware {
  private static instance: AuthorizationMiddleware;

  private constructor() {
    //
  }

  public static getInstance = (): AuthorizationMiddleware => {
    if (!AuthorizationMiddleware.instance) {
      AuthorizationMiddleware.instance = new AuthorizationMiddleware();
    }
    return AuthorizationMiddleware.instance;
  };

  private handlePasswordOperation = async (
    req: Request,
    res: Response,
    next: NextFunction,
    tokenType: 'password_setup' | 'password_reset',
  ): Promise<void> => {
    try {
      const role = getUserRole(req);
      const { newPassword, confirmPassword, token } = req.body;

      if (!newPassword || !confirmPassword || !token) {
        return responseUtil.sendError(res, {
          message: 'Password and token are required',
          statusCode: StatusCodes.BAD_REQUEST,
          code: 'MISSING_CREDENTIALS',
        });
      }

      const verified = await jwtUtil.verify({
        role,
        token,
        type: tokenType,
      });

      req.app.locals.userId = verified.id;
      next();
    } catch (error) {
      responseUtil.sendError(res, {
        message: 'Authorization failed',
        statusCode: StatusCodes.UNAUTHORIZED,
        code: 'AUTHORIZATION_FAILED',
      });
    }
  };

  public isAuthorized =
    (allowedRoles: string[]) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const accessToken = req.cookies['access_token'];
        if (!accessToken) {
          return responseUtil.sendError(res, {
            message: 'Access token is missing',
            statusCode: StatusCodes.UNAUTHORIZED,
          });
        }

        const decodedToken: IDecodedJwtToken = jwtUtil.decode(
          accessToken,
        ) as IDecodedJwtToken;
        if (!decodedToken) {
          return responseUtil.sendError(res, {
            message: 'Invalid access token',
            statusCode: StatusCodes.UNAUTHORIZED,
          });
        }

        const verifiedToken = await jwtUtil.verify({
          role: decodedToken.role,
          token: accessToken,
          type: decodedToken.type,
        });

        if (!verifiedToken) {
          return responseUtil.sendError(res, {
            message: 'Access token verification failed',
            statusCode: StatusCodes.UNAUTHORIZED,
          });
        }

        if (!allowedRoles.includes(decodedToken.role)) {
          return responseUtil.sendError(res, {
            message: 'Access denied: insufficient permissions',
            statusCode: StatusCodes.FORBIDDEN,
          });
        }

        next();
      } catch (error) {
        next(error);
      }
    };

  public authorizePasswordSetup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.handlePasswordOperation(req, res, next, 'password_setup');
  };

  public authorizePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await this.handlePasswordOperation(req, res, next, 'password_reset');
  };
}

export const authorizationMiddleware = AuthorizationMiddleware.getInstance();
