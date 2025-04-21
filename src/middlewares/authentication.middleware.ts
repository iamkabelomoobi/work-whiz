import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { responseUtil, jwtUtil, logger } from '@work-whiz/utils';
import { validateInput } from '@work-whiz/validators';

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

  /**
   * Middleware to validate API key authentication via the 'X-Authorization' header.
   *
   * The expected header format is: 'X-Authorization: Bearer <API_KEY>'.
   * If the header is missing, incorrectly formatted, or the API key is invalid,
   * the request will be rejected with a 401 Unauthorized response.
   *
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Express next middleware function
   *
   * @returns {Promise<void>} - Calls next() if authentication is successful
   */
  public isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const AUTH_HEADER = 'x-authorization';
    const authHeader = req.headers[AUTH_HEADER] as string;

    if (!authHeader) {
      return responseUtil.sendError(res, {
        message:
          "Missing or invalid API key. Provide it in the 'X-Authorization: Bearer <API_KEY>' header.",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return responseUtil.sendError(res, {
        message: "Invalid API key format. Use 'Bearer <API_KEY>'.",
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    const isValid = validateInput(token, process.env.API_KEY as string);
    if (!isValid) {
      return responseUtil.sendError(res, {
        message: 'Invalid or expired API key.',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }

    next();
  };

  public sAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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
    const decodedToken = jwtUtil.decode(token);
    try {
      const decoded = await jwtUtil.verify({
        token,
        type: 'access',
        role: decodedToken.role,
      });

      req.app.locals.userId = decoded.id;
      next();
    } catch (error) {
      logger.error('Token verification error:', error);
      responseUtil.sendError(res, {
        message: 'Invalid or expired token',
        statusCode: StatusCodes.UNAUTHORIZED,
      });
    }
  };
}

export const authenticationMiddleware = AuthenticationMiddleware.getInstance();
