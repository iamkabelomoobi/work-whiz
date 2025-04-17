import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { authenticationService } from '@work-whiz/services';
import { responseUtil, csrfUtil, getUserRole } from '@work-whiz/utils';
import {
  IAdminRegister,
  ICandidateRegister,
  IEmployerRegister,
} from '@work-whiz/interfaces';
import { emailValidator } from '@work-whiz/validators/email.validator';
import { passwordValidator } from '@work-whiz/validators/password.validator';
import {
  adminRegisterValidator,
  candidateRegisterValidator,
  employerRegisterValidator,
} from '@work-whiz/validators';

const SESSION_EXPIRED_MESSAGE = 'Session has expired';
const INVALID_CSRF_MESSAGE = 'Invalid CSRF token';

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

export class AuthenticationController {
  private static instance: AuthenticationController;

  private readonly REFRESH_TOKEN_COOKIE = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };

  private readonly CSRF_TOKEN_COOKIE = {
    httpOnly: false,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 4 * 60 * 60 * 1000,
    path: '/',
  };

  private constructor() {
    //
  }

  /**
   * Singleton pattern for controller instantiation.
   */
  public static getInstance(): AuthenticationController {
    if (!AuthenticationController.instance) {
      AuthenticationController.instance = new AuthenticationController();
    }
    return AuthenticationController.instance;
  }

  /**
   * Sets authentication cookies (refresh + CSRF token)
   */
  private setAuthCookies(
    res: Response,
    refreshToken: string,
    csrfToken: string
  ): void {
    res
      .cookie('refresh_token', refreshToken, this.REFRESH_TOKEN_COOKIE)
      .cookie('x-csrf-token', csrfToken, this.CSRF_TOKEN_COOKIE);
  }

  /**
   * Clears authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    res
      .clearCookie('refresh_token', { path: this.REFRESH_TOKEN_COOKIE.path })
      .clearCookie('x-csrf-token', { path: this.CSRF_TOKEN_COOKIE.path });
  }

  /**
   * Validates that the request has a refresh token and user ID
   */
  private validateRefreshRequest(
    req: Request,
    res: Response
  ): { refreshToken: string; userId: string } | null {
    const refreshToken = req.cookies.refresh_token;
    const userId = req.app.locals.userId;

    if (!refreshToken || !userId) {
      responseUtil.sendError(
        res,
        SESSION_EXPIRED_MESSAGE,
        StatusCodes.UNAUTHORIZED
      );
      return null;
    }

    return { refreshToken, userId };
  }

  /**
   * Validates CSRF token from request
   */
  private validateCsrf(req: Request, res: Response): boolean {
    if (!csrfUtil.validate(req)) {
      responseUtil.sendError(res, INVALID_CSRF_MESSAGE, StatusCodes.FORBIDDEN);
      return false;
    }
    return true;
  }

  /**
   * Validates email and password fields in the request
   */
  private validateEmailAndPassword(
    email: string,
    password: string,
    res: Response
  ): boolean {
    if (!email?.trim() || !password?.trim()) {
      responseUtil.sendError(
        res,
        'Email and password are required',
        StatusCodes.BAD_REQUEST
      );
      return false;
    }

    const emailError = emailValidator(email);
    if (emailError) {
      responseUtil.sendError(
        res,
        emailError.details[0].message,
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      return false;
    }

    const passwordError = passwordValidator(password);
    if (passwordError) {
      responseUtil.sendError(
        res,
        passwordError.details[0].message,
        StatusCodes.UNPROCESSABLE_ENTITY
      );
      return false;
    }

    return true;
  }

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

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const role = getUserRole(req);

      const registerData = req.body as
        | IAdminRegister
        | ICandidateRegister
        | IEmployerRegister;

      let registerErrors = null;

      switch (role) {
        case 'admin':
          registerErrors = adminRegisterValidator(
            registerData as IAdminRegister
          );
          break;
        case 'candidate':
          registerErrors = candidateRegisterValidator(
            registerData as ICandidateRegister
          );
          break;
        case 'employer':
          registerErrors = employerRegisterValidator(
            registerData as IEmployerRegister
          );
          break;
        default:
          return responseUtil.sendError(
            res,
            { message: 'Invalid role provided for registration.' },
            StatusCodes.BAD_REQUEST
          );
      }

      if (registerErrors) {
        return responseUtil.sendError(
          res,
          { message: registerErrors.message },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }

      const response = await authenticationService.register(role, registerData);
      responseUtil.sendSuccess(res, response);
    } catch (error) {
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

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
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        responseUtil.sendError(
          res,
          'Email and password are required',
          StatusCodes.BAD_REQUEST
        );
      }

      const { accessToken, refreshToken } = await authenticationService.login(
        email,
        password
      );
      const csrfToken = csrfUtil.generate(req, res);

      this.setAuthCookies(res, refreshToken, csrfToken);

      responseUtil.sendSuccess(res, { accessToken, csrfToken }, StatusCodes.OK);
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

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

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals.userId;

      const response = await authenticationService.logout(userId);

      this.clearAuthCookies(res);
      responseUtil.sendSuccess(res, response, StatusCodes.OK);
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

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

  public setupPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const userId = req.app.locals.userId;

      const passwordError = passwordValidator(password);
      if (passwordError) {
        return responseUtil.sendError(
          res,
          { message: passwordError.details[0].message },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }

      const response = await authenticationService.setupPassword(
        userId,
        password
      );
      responseUtil.sendSuccess(res, response, StatusCodes.OK);
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

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

  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!this.validateCsrf(req, res)) return;

      const tokens = this.validateRefreshRequest(req, res);
      if (!tokens) return;

      const { userId, refreshToken } = tokens;

      const { accessToken, refreshToken: newRefreshToken } =
        await authenticationService.refreshToken(userId, refreshToken);

      const newCsrfToken = csrfUtil.generate(req, res);
      this.setAuthCookies(res, newRefreshToken, newCsrfToken);

      responseUtil.sendSuccess(
        res,
        { accessToken, csrfToken: newCsrfToken },
        StatusCodes.OK
      );
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

  /**
   * @swagger
   * /api/v1/auth/forgot-password:
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

  public forgotPassword = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const emailError = emailValidator(email);
      if (emailError) {
        return responseUtil.sendError(
          res,
          { message: emailError.details[0].message },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }

      const response = await authenticationService.forgotPassword(email);
      responseUtil.sendSuccess(res, response, StatusCodes.OK);
    } catch (error) {
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };

  /**
   * @swagger
   * /api/v1/auth/reset-password:
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

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals.userId;
      const { password } = req.body;
      // const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;

      const passwordError = passwordValidator(password);
      if (passwordError) {
        return responseUtil.sendError(
          res,
          { message: passwordError.details[0].message },
          StatusCodes.UNPROCESSABLE_ENTITY
        );
      }

      const userAgent = req.app.locals.userAgent;
      const response = await authenticationService.resetPassword(
        userId,
        password,
        {
          browser: userAgent.browser,
          os: userAgent.os,
          ip: '24.48.0.1',
          timestamp: new Date().toISOString(),
        }
      );

      responseUtil.sendSuccess(res, response, StatusCodes.OK);
    } catch (error) {
      responseUtil.sendError(
        res,
        error.message,
        error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  };
}

export const authenticationController = AuthenticationController.getInstance();
