import { jwtUtil, logger, responseUtil } from '@work-whiz/utils';
import { Request, Response, NextFunction, response } from 'express';
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
   * Middleware to authorize a user based on the refresh token stored in an HTTP-only cookie.
   *
   * This checks for the 'refresh_token' cookie, decodes and verifies it.
   * If valid, attaches the user ID to `req.app.locals.userId`.
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   *
   * @returns {Promise<void>} - Calls next() if authorization is successful, otherwise sends 401 error.
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
          message: 'Missing refresh token.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const decoded = jwtUtil.decode(refreshToken);
      if (!decoded) {
        return responseUtil.sendError(res, {
          message: 'Invalid refresh token.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const verified = await jwtUtil.verify({
        token: refreshToken,
        type: decoded.type,
        role: decoded.role,
      });

      if (!verified) {
        return responseUtil.sendError(res, {
          message: 'Invalid or expired refresh token.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      req.app.locals.userId = verified.id;
      next();
    } catch (error) {
      responseUtil.sendError(res, {
        message: 'Invalid or expired token.',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }
  };

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
        responseUtil.sendError(res, {
          message: 'Password and token are required.',
          statusCode: StatusCodes.BAD_GATEWAY,
        });
      }

      const decodedPasswordToken = jwtUtil.decode(passwordToken);
      if (!decodedPasswordToken) {
        responseUtil.sendError(res, {
          message: 'Invalid password token.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      if (decodedPasswordToken.type !== 'password_setup') {
        responseUtil.sendError(res, {
          message: 'Invalid token type',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const verifiedPasswordToken = await jwtUtil.verify({
        role: decodedPasswordToken.role,
        token: passwordToken,
        type: decodedPasswordToken.type,
      });
      if (!verifiedPasswordToken) {
        responseUtil.sendError(res, {
          message: 'Invalid password token',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      req.app.locals.userId = verifiedPasswordToken.id;
      next();
    } catch (error) {
      logger.error('Error in authorizing password setup:', error);

      responseUtil.sendError(res, {
        message: 'Error in authorizing password setup',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
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
        responseUtil.sendError(res, {
          message: 'Password and token are required.',
          statusCode: StatusCodes.BAD_GATEWAY,
        });
      }

      const decodedPasswordToken = jwtUtil.decode(token);
      if (!decodedPasswordToken) {
        responseUtil.sendError(res, {
          message: 'Invalid password token.',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }
      if (decodedPasswordToken.type !== 'password_reset') {
        responseUtil.sendError(res, {
          message: 'Invalid token type',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const verifiedPasswordToken = await jwtUtil.verify({
        role: decodedPasswordToken.role,
        token,
        type: decodedPasswordToken.type,
      });
      if (!verifiedPasswordToken) {
        responseUtil.sendError(res, {
          message: 'Invalid password token',
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      req.app.locals.userId = verifiedPasswordToken.id;
      next();
    } catch (error) {
      console.error(error);
      responseUtil.sendError(res, {
        message: 'Invalid or expired token',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }
  };
}

export const authorizationMiddleare = AuthorizationMiddleware.getInstance();
