import { Router } from 'express';
import { authenticationController } from '@work-whiz/controllers';
import {
  authenticationMiddleware,
  authorizationMiddleare,
  userAgentParser,
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
        .post('/register', authenticationController.register)

        /**
         * @route POST /password/set
         * @description Set the password during registration or after account creation
         */
        .post(
          '/password/set',
          authorizationMiddleare.authorizePasswordSetup,
          authenticationController.setupPassword
        )

        /**
         * @route POST /login
         * @description Login an existing user
         */
        .post('/login', authenticationController.login)

        /**
         * @route DELETE /logout
         * @description Logout the user from the session
         */
        .delete(
          '/logout',
          authenticationMiddleware.isAuthenticated,
          authenticationController.logout
        )

        /**
         * @route POST /password/recover
         * @description Request a password reset
         */
        .post('/password/recover', authenticationController.forgotPassword)

        /**
         * @route PATCH /password/change
         * @description Reset the user's password
         */
        .patch(
          '/password/change',
          authorizationMiddleare.authorizePasswordReset,
          userAgentParser,
          authenticationController.resetPassword
        )
    );
  }
}
