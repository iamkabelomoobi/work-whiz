import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { responseUtil, jwtUtil } from '@work-whiz/utils';

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
    // const csrfValid = csrfUtil.validate(req);
    // if (!csrfValid) {
    //   responseUtil.sendError(res, {
    //     message: 'Invalid CSRF token',
    //     statusCode: StatusCodes.FORBIDDEN,
    //   });
    //   return;
    // }

    const authorizationHeader = req.headers['x-authorization'] as string;

    if (!authorizationHeader) {
      responseUtil.sendError(res, {
        message:
          "Missing or invalid API key. Provide it in the 'X-Authorization: Bearer <TOKEN>' header.",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      responseUtil.sendError(res, {
        message: "Invalid Authorization header format. Use 'Bearer <TOKEN>'.",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
      return;
    }

    const token = parts[1];
    try {
      const decoded = await jwtUtil.verify({
        token,
        type: 'access',
        role: 'admin',
      });

      req.app.locals.userId = decoded.id;
      next();
    } catch (error) {
      responseUtil.sendError(res, {
        message: 'Invalid or expired token',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }
  };
}

export const authenticationMiddleware = AuthenticationMiddleware.getInstance();
