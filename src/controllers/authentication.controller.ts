import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { authenticationService } from '@work-whiz/services';
import { responseUtil, getUserRole } from '@work-whiz/utils';
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
  validateInput,
} from '@work-whiz/validators';
import { Role } from '@work-whiz/types';

const SESSION_EXPIRED_MESSAGE = 'Session has expired';

/**
 * Controller handling all authentication-related operations.
 * Implements singleton pattern to ensure a single instance throughout the application.
 */
export class AuthenticationController {
  private static instance: AuthenticationController;

  /**
   * Configuration for refresh token cookie.
   * Secure, HTTP-only cookie with 7-day expiration.
   */
  private readonly REFRESH_TOKEN_COOKIE = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh-token',
  };

  /**
   * Configuration for access token cookie.
   * Secure, HTTP-only cookie with 15-minute expiration.
   */
  private readonly ACCESS_TOKEN_COOKIE = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes
    path: '/',
  };

  private constructor() {
    //
  }

  /**
   * Singleton pattern for controller instantiation.
   * @returns {AuthenticationController} The singleton instance of AuthenticationController
   */
  public static getInstance(): AuthenticationController {
    if (!AuthenticationController.instance) {
      AuthenticationController.instance = new AuthenticationController();
    }
    return AuthenticationController.instance;
  }

  /**
   * Sets authentication cookies (refresh + access token) in the response.
   * @param {Response} res - Express response object
   * @param {string} refreshToken - JWT refresh token
   * @param {string} accessToken - JWT access token
   * @returns {void}
   */
  private setAuthCookies(
    res: Response,
    refreshToken: string,
    accessToken: string,
  ): void {
    res
      .cookie('refresh_token', refreshToken, this.REFRESH_TOKEN_COOKIE)
      .cookie('access_token', accessToken, this.ACCESS_TOKEN_COOKIE);
  }

  /**
   * Clears authentication cookies from the response.
   * @param {Response} res - Express response object
   * @returns {void}
   */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('refresh_token', { path: this.REFRESH_TOKEN_COOKIE.path });
    res.clearCookie('access_token', { path: this.ACCESS_TOKEN_COOKIE.path });
  }

  /**
   * Handles user registration based on role (admin, candidate, or employer).
   * Validates input data according to role-specific requirements.
   * @param {Request} req - Express request object containing registration data in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const role: Role = getUserRole(req);

      const registerData = req.body as
        | IAdminRegister
        | ICandidateRegister
        | IEmployerRegister;

      let registerErrors = null;

      switch (role) {
        case Role.ADMIN:
          registerErrors = adminRegisterValidator(
            registerData as IAdminRegister,
          );
          break;
        case Role.CANDIDATE:
          registerErrors = candidateRegisterValidator(
            registerData as ICandidateRegister,
          );
          break;
        case Role.EMPLOYER:
          registerErrors = employerRegisterValidator(
            registerData as IEmployerRegister,
          );
          break;
        default:
          return responseUtil.sendError(res, {
            message: 'Invalid role provided for registration.',
            statusCode: StatusCodes.BAD_REQUEST,
          });
      }

      if (registerErrors) {
        return responseUtil.sendError(res, {
          message: registerErrors.message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      await authenticationService.register(role, registerData);
      responseUtil.sendSuccess(res, { message: 'Registration successful' });
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Handles user login with email and password credentials.
   * Sets authentication cookies upon successful login.
   * @param {Request} req - Express request object containing email and password in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return responseUtil.sendError(res, {
          message: 'Email and password are required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const { accessToken, refreshToken } = await authenticationService.login(
        email,
        password,
      );

      this.setAuthCookies(res, refreshToken, accessToken);

      responseUtil.sendSuccess(
        res,
        { message: 'Login successful' },
        String(StatusCodes.OK),
      );
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Handles user logout by invalidating tokens and clearing cookies.
   * @param {Request} req - Express request object with userId in app.locals
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.app.locals;

      await authenticationService.logout(userId);

      this.clearAuthCookies(res);
      responseUtil.sendSuccess(res, { message: 'Logout successful' }, String(StatusCodes.OK));
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Handles token refresh using a valid refresh token.
   * Issues new access and refresh tokens upon successful validation.
   * @param {Request} req - Express request object with refresh_token cookie and userId in app.locals
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refresh_token;
      const { userId } = req.app.locals;

      if (!refreshToken || !userId) {
        return responseUtil.sendError(res, {
          message: SESSION_EXPIRED_MESSAGE,
          statusCode: StatusCodes.UNAUTHORIZED,
        });
      }

      const { accessToken, refreshToken: newRefreshToken } =
        await authenticationService.refreshToken(userId, refreshToken);

      this.setAuthCookies(res, newRefreshToken, accessToken);

      responseUtil.sendSuccess(
        res,
        { message: 'Token refreshed successfully' },
        String(StatusCodes.OK),
      );
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(res, {
        message:
          error.message || 'An error occurred while refreshing the token',
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Handles forgot password request by sending OTP to user's email.
   * Validates email format before processing.
   * @param {Request} req - Express request object containing email in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public forgotPassword = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { email } = req.body;

      const emailError = emailValidator(email);
      if (emailError) {
        return responseUtil.sendError(res, {
          message: emailError.details[0].message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      await authenticationService.forgotPassword(email);
      responseUtil.sendSuccess(res, { message: 'Password reset instructions sent' }, String(StatusCodes.OK));
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Verifies OTP sent to user's email during password reset flow.
   * OTP must be a 6-digit number.
   * @param {Request} req - Express request object containing email and otp in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public verifyOtp = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return responseUtil.sendError(res, {
          message: 'Email and OTP are required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const emailError = emailValidator(email);
      if (emailError) {
        return responseUtil.sendError(res, {
          message: emailError.details[0].message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      if (!/^\d{6}$/.test(otp)) {
        return responseUtil.sendError(res, {
          message: 'OTP must be a 6-digit number.',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      await authenticationService.verifyOtp(email, otp);
      responseUtil.sendSuccess(res, { message: 'OTP verified successfully' }, String(StatusCodes.OK));
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Resets user password after successful OTP verification.
   * Logs password reset activity with device and IP information.
   * @param {Request} req - Express request object containing password in body, userId and userAgent in app.locals
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userAgent } = req.app.locals;
      const { newPassword, confirmPassword } = req.body;

      if (!validateInput(newPassword, confirmPassword)) {
        return responseUtil.sendError(res, {
          message: 'Passwords do not match',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }
      const passwordError = passwordValidator(confirmPassword);
      if (passwordError) {
        return responseUtil.sendError(res, {
          message: passwordError.details[0].message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      const ipHeader =
        req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;

      const ip = Array.isArray(ipHeader)
        ? ipHeader[0].trim()
        : ipHeader.split(',')[0].trim();

      await authenticationService.resetPassword(
        userId,
        confirmPassword,
        {
          browser: userAgent.browser,
          os: userAgent.os,
          ip: ip as string,
          timestamp: new Date().toISOString(),
        },
      );

      responseUtil.sendSuccess(res, { message: 'Password reset successful' }, String(StatusCodes.OK));
    } catch (error) {
      responseUtil.sendError(res, {
        message:
          error.message || 'An error occurred while resetting the password',
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };
}

export const authenticationController = AuthenticationController.getInstance();
