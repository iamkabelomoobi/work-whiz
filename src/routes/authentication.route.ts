import { Router } from 'express';
import { authenticationController } from '@work-whiz/controllers';
import {
  authenticationMiddleware,
  authorizationMiddleware,
  userAgentParser,
  registerLimiter,
  loginLimiter,
  logoutLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  setupPasswordLimiter,
} from '@work-whiz/middlewares';

/**
 * Class for defining authentication routes
 */
export class AuthenticationRoutes {
  constructor(private readonly router: Router = Router()) {}

  /**
   * Initializes the authentication routes
   * @returns {Router} The configured router with all authentication routes
   */
  public init(): Router {
    return (
      this.router
        /**
         * @route POST /register
         * @description Register a new user
         */
        .post('/register', registerLimiter, authenticationController.register)

        /**
         * @route POST /password/set
         * @description Set the password during registration or after account creation
         */
        .post(
          '/password/set',
          setupPasswordLimiter,
          authorizationMiddleware.authorizePasswordSetup,
          authenticationController.setupPassword,
        )

        /**
         * @route POST /login
         * @description Login an existing user
         */
        .post('/login', loginLimiter, authenticationController.login)

        .post('/refresh-token', authenticationController.refreshToken)

        /**
         * @route DELETE /logout
         * @description Logout the user from the session
         */
        .delete(
          '/logout',
          logoutLimiter,
          authenticationMiddleware.isAuthenticated,
          authenticationController.logout,
        )

        /**
         * @route POST /password/recover
         * @description Request a password reset
         */
        .post(
          '/password/recover',
          forgotPasswordLimiter,
          authenticationController.forgotPassword,
        )

        /**
         * @route PATCH /password/change
         * @description Reset the user's password
         */
        .patch(
          '/password/change',
          resetPasswordLimiter,
          authorizationMiddleware.authorizePasswordReset,
          userAgentParser,
          authenticationController.resetPassword,
        )
    );
  }
}
