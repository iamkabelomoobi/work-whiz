import { jwtUtil, responseUtil } from '@work-whiz/utils';
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';

class AuthorizationMiddleware {
  private static instance: AuthorizationMiddleware;

  private constructor() {
    //
  }

  public static getInstance(): AuthorizationMiddleware {
    if (!AuthorizationMiddleware.instance) {
      AuthorizationMiddleware.instance = new AuthorizationMiddleware();
    }
    return AuthorizationMiddleware.instance;
  }

  /**
   * Middleware to authorize password setup
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Next function to call the next middleware
   */
  public authorizePasswordSetup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const {
        password,
        passwordToken,
      }: { password: string; passwordToken: string } = req.body;

      if (!password || !passwordToken) {
        responseUtil.sendError(
          res,
          { message: 'Password and token are required.' },
          StatusCodes.BAD_GATEWAY,
        );
      }

      const decodedPasswordToken = jwtUtil.decode(passwordToken);
      if (!decodedPasswordToken) {
        responseUtil.sendError(
          res,
          { message: 'Invalid password token.' },
          StatusCodes.UNAUTHORIZED,
        );
      }

      if (decodedPasswordToken.type !== 'password_setup') {
        responseUtil.sendError(
          res,
          { message: 'Invalid token type' },
          StatusCodes.UNAUTHORIZED,
        );
      }

      const verifiedPasswordToken = await jwtUtil.verify({
        role: decodedPasswordToken.role,
        token: passwordToken,
        type: decodedPasswordToken.type,
      });
      if (!verifiedPasswordToken) {
        responseUtil.sendError(
          res,
          { message: 'Invalid password token' },
          StatusCodes.UNAUTHORIZED,
        );
      }

      req.app.locals.userId = verifiedPasswordToken.id;
      next();
    } catch (error) {
      responseUtil.sendError(
        res,
        { message: 'Error in authorizing password setup' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  };

  /**
   * Middleware to authorize password reset
   * @param req - Express request object
   * @param res - Express response object
   * @param next - Next function to call the next middleware
   */
  public authorizePasswordReset = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { password, token }: { password: string; token: string } = req.body;

      if (!password || !token) {
        responseUtil.sendError(
          res,
          { message: 'Password and token are required.' },
          StatusCodes.BAD_GATEWAY,
        );
      }

      const decodedPasswordToken = jwtUtil.decode(token);
      if (!decodedPasswordToken) {
        responseUtil.sendError(
          res,
          { message: 'Invalid password token.' },
          StatusCodes.UNAUTHORIZED,
        );
      }
      if (decodedPasswordToken.type !== 'password_reset') {
        responseUtil.sendError(
          res,
          { message: 'Invalid token type' },
          StatusCodes.UNAUTHORIZED,
        );
      }

      const verifiedPasswordToken = await jwtUtil.verify({
        role: decodedPasswordToken.role,
        token,
        type: decodedPasswordToken.type,
      });
      if (!verifiedPasswordToken) {
        responseUtil.sendError(
          res,
          { message: 'Invalid password token' },
          StatusCodes.UNAUTHORIZED,
        );
      }

      req.app.locals.userId = verifiedPasswordToken.id;
      next();
    } catch (error) {
      console.error(error);
      responseUtil.sendError(
        res,
        { message: 'Invalid or expired token' },
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  };
}

export const authorizationMiddleare = AuthorizationMiddleware.getInstance();
