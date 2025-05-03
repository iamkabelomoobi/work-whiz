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
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints related to user authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         accessToken:
 *           type: string
 *         csrfToken:
 *           type: string
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *     RegisterRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *         password:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, candidate, employer]
 *         userData:
 *           type: object
 *           description: Role-specific data for the user
 *           oneOf:
 *             - $ref: '#/components/schemas/IAdminRegister'
 *             - $ref: '#/components/schemas/ICandidateRegister'
 *             - $ref: '#/components/schemas/IEmployerRegister'
 *     PasswordRequest:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 *     EmailRequest:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *     IAdminRegister:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *       required:
 *         - firstName
 *         - lastName
 *     ICandidateRegister:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         title:
 *           type: string
 *       required:
 *         - firstName
 *         - lastName
 *         - title
 *     IEmployerRegister:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         industry:
 *           type: string
 *       required:
 *         - name
 *         - industry
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
         * @swagger
         * /api/v1/auth/register:
         *   post:
         *     summary: Register a new user (admin, candidate, or employer)
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/RegisterRequest'
         *     responses:
         *       200:
         *         description: User registered successfully
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *       400:
         *         description: Bad Request
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/ErrorResponse'
         *       422:
         *         description: Validation error
         */

        .post('/register', registerLimiter, authenticationController.register)

        /**
         * @swagger
         * /api/v1/auth/setup-password:
         *   post:
         *     summary: Setup password for a new account
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/PasswordRequest'
         *     responses:
         *       200:
         *         description: Password setup successful
         *       422:
         *         description: Invalid password format
         */
        .post(
          '/password/set',
          setupPasswordLimiter,
          authorizationMiddleware.authorizePasswordSetup,
          authenticationController.setupPassword,
        )

        /**
         * @swagger
         * /api/v1/auth/login:
         *   post:
         *     summary: Login with email and password
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             type: object
         *             properties:
         *               email:
         *                 type: string
         *               password:
         *                 type: string
         *     responses:
         *       200:
         *         description: Successful login
         *       401:
         *         description: Unauthorized
         */

        .post('/login', loginLimiter, authenticationController.login)

        /**
         * @swagger
         * /api/v1/auth/refresh-token:
         *   post:
         *     summary: Refresh access token using refresh token and CSRF token
         *     tags: [Auth]
         *     responses:
         *       200:
         *         description: Access token refreshed
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/AuthSuccessResponse'
         *       401:
         *         description: Session expired
         *       403:
         *         description: Invalid CSRF token
         */

        .post(
          '/refresh-token',
          loginLimiter,
          authenticationController.refreshToken,
        )

        /**
         * @swagger
         * /api/v1/auth/logout:
         *   delete:
         *     summary: Log out the current user
         *     tags: [Auth]
         *     responses:
         *       200:
         *         description: Logout successful
         *       500:
         *         description: Internal server error
         */

        .delete(
          '/logout',
          logoutLimiter,
          authenticationMiddleware.isAuthenticated,
          authenticationController.logout,
        )

        /**
         * @swagger
         * /api/v1/auth/password/recover:
         *   post:
         *     summary: Send a password reset link to user's email
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/EmailRequest'
         *     responses:
         *       200:
         *         description: Password reset email sent
         *       422:
         *         description: Invalid email format
         */
        .post(
          '/password/recover',
          forgotPasswordLimiter,
          authenticationController.forgotPassword,
        )

        /**
         * @swagger
         * /api/v1/auth/password/change:
         *   patch:
         *     summary: Reset password using token
         *     tags: [Auth]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/PasswordRequest'
         *     responses:
         *       200:
         *         description: Password reset successful
         *       422:
         *         description: Invalid password
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
