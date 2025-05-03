import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { responseUtil } from '@work-whiz/utils';
import { validateInput } from '@work-whiz/validators';
import { config } from '@work-whiz/configs/config';

class AuthenticationMiddleware {
  private static instance: AuthenticationMiddleware;

  private constructor() {
    //
  }

  public static getInstance(): AuthenticationMiddleware {
    if (!AuthenticationMiddleware.instance) {
      AuthenticationMiddleware.instance = new AuthenticationMiddleware();
    }
    return AuthenticationMiddleware.instance;
  }

  public isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return responseUtil.sendError(res, {
          message: 'Authorization header is missing',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      if (!authHeader.startsWith('Bearer ')) {
        return responseUtil.sendError(res, {
          message: 'Invalid authorization header format',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const apiKey = authHeader.split(' ')[1];
      if (!apiKey) {
        return responseUtil.sendError(res, {
          message: 'API key is missing',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      if (!validateInput(apiKey, config.authentication.api.secret)) {
        return responseUtil.sendError(res, {
          message: 'Invalid API key',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const authenticationMiddleware = AuthenticationMiddleware.getInstance();
