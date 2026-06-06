import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { auth } from '@work-whiz/libs';
import { responseUtil } from '@work-whiz/utils';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Authorization middleware for role checks backed by Better Auth sessions.
 * Implements the Singleton pattern to ensure only one instance exists
 */
class AuthorizationMiddleware {
  private static instance: AuthorizationMiddleware;

  private constructor() {
    // Singleton pattern enforcement
  }

  /**
   * Gets the singleton instance of AuthorizationMiddleware
   * @returns {AuthorizationMiddleware} The singleton instance
   */
  public static getInstance = (): AuthorizationMiddleware => {
    if (!AuthorizationMiddleware.instance) {
      AuthorizationMiddleware.instance = new AuthorizationMiddleware();
    }
    return AuthorizationMiddleware.instance;
  };

  /**
   * Middleware factory function for role-based authorization
   * @param {string[]} allowedRoles - Array of role names permitted to access the route
   * @returns {Function} Express middleware function that validates Better Auth session roles
   * @example
   * // Usage in route definition
   * router.get('/admin',
   *   authorizationMiddleware.isAuthorized(['admin', 'super_admin']),
   *   adminController.getDashboard
   * );
   */
  public isAuthorized =
    (allowedRoles: string[]) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
          return responseUtil.sendError(res, {
            message: 'Authentication required',
            statusCode: StatusCodes.UNAUTHORIZED,
          });
        }

        const user = session.user as typeof session.user & { role?: string };

        if (!user.role || !allowedRoles.includes(user.role)) {
          return responseUtil.sendError(res, {
            message: 'Access denied: insufficient permissions',
            statusCode: StatusCodes.FORBIDDEN,
          });
        }

        req.app.locals.userId = user.id;
        req.app.locals.session = session.session;
        req.app.locals.user = user;

        next();
      } catch (error) {
        next(error);
      }
    };
}

/**
 * Singleton instance of AuthorizationMiddleware
 * @type {AuthorizationMiddleware}
 */
export const authorizationMiddleware: AuthorizationMiddleware =
  AuthorizationMiddleware.getInstance();
