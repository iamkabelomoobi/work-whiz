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
   * Uses secure, HTTP-only cookies with appropriate expiration times.
   *
   * @param {Response} res - Express response object
   * @param {string} refreshToken - JWT refresh token (7-day expiry)
   * @param {string} accessToken - JWT access token (15-minute expiry)
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
   * Removes both access and refresh token cookies with proper path specification.
   *
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
   *
   * @param {Request} req - Express request object containing registration data in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @throws {Error} When role is invalid or not provided
   * @throws {Error} When validation fails for role-specific registration data
   * @throws {Error} When registration service encounters an error
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

      const response = await authenticationService.register(role, registerData);
      responseUtil.sendSuccess(res, response, String(StatusCodes.CREATED));
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Verifies a user's account using email and OTP (One-Time Password).
   * This is typically called after registration to confirm email ownership.
   *
   * @param {Request} req - Express request object with email and otp in body
   * @param {Request} req.body - Request body
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.otp - 6-digit verification code sent to email
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @throws {Error} When email or OTP is missing (400 Bad Request)
   * @throws {Error} When email format is invalid (422 Unprocessable Entity)
   * @throws {Error} When OTP is not a 6-digit number (400 Bad Request)
   * @throws {Error} When verification fails or OTP is expired/invalid
   */
  public verifyAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return responseUtil.sendError(res, {
          message: 'Email and OTP are required.',
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

      const { accessToken, refreshToken } =
        await authenticationService.verifyAccountOtp(email, otp);

      this.setAuthCookies(res, refreshToken, accessToken);

      responseUtil.sendSuccess(
        res,
        { message: 'Account verified successfully' },
        String(StatusCodes.OK),
      );
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
   *
   * @param {Request} req - Express request object containing email and password in body
   * @param {Request} req.body - Request body
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.password - User's password
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @throws {Error} When email or password is missing (400 Bad Request)
   * @throws {Error} When credentials are invalid (401 Unauthorized)
   * @throws {Error} When user account is not verified or disabled
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
   * Removes all active sessions for the user.
   *
   * @param {Request} req - Express request object with userId in app.locals
   * @param {Request} req.app.locals - Express app locals object
   * @param {string} req.app.locals.userId - Current authenticated user's ID
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.app.locals;

      await authenticationService.logout(userId);

      this.clearAuthCookies(res);
      responseUtil.sendSuccess(
        res,
        { message: 'Logout successful' },
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
   * Handles token refresh using a valid refresh token.
   * Issues new access and refresh tokens upon successful validation.
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
   * Validates email format before processing and triggers OTP generation.
   *
   * @param {Request} req - Express request object containing email in body
   * @param {Request} req.body - Request body
   * @param {string} req.body.email - User's email address for password reset
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
      responseUtil.sendSuccess(
        res,
        { message: 'Password reset instructions sent' },
        String(StatusCodes.OK),
      );
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Verifies OTP sent to user's email during password reset flow.
   * OTP must be a 6-digit number and match the one sent via email.
   *
   * @param {Request} req - Express request object containing email and otp in body
   * @param {Request} req.body - Request body
   * @param {string} req.body.email - User's email address
   * @param {string} req.body.otp - 6-digit verification code sent to email
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @throws {Error} When email or OTP is missing (400 Bad Request)
   * @throws {Error} When email format is invalid (422 Unprocessable Entity)
   * @throws {Error} When OTP format is invalid - not 6 digits (400 Bad Request)
   * @throws {Error} When OTP is incorrect, expired, or already used (401 Unauthorized)
   *
   * @remarks
   * - OTP must be exactly 6 numeric digits
   * - OTP typically expires after 10-15 minutes
   * - Each OTP can only be used once
   * - Returns 200 OK on successful verification
   * - User must call resetPassword endpoint after successful verification
   *
   * @security
   * - Rate limiting prevents brute force attacks
   * - OTP is invalidated after verification
   * - Failed attempts should be logged for security monitoring
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
      responseUtil.sendSuccess(
        res,
        { message: 'OTP verified successfully' },
        String(StatusCodes.OK),
      );
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  /**
   * Resets user password after successful OTP verification.
   * Logs password reset activity with device and IP information for audit trail.
   *
   * @param {Request} req - Express request object containing password in body, userId and userAgent in app.locals
   * @param {Request} req.body - Request body
   * @param {string} req.body.newPassword - New password to set
   * @param {string} req.body.confirmPassword - Password confirmation (must match newPassword)
   * @param {Request} req.app.locals - Express app locals object
   * @param {string} req.app.locals.userId - User ID from OTP verification
   * @param {object} req.app.locals.userAgent - Parsed user agent information
   * @param {string} req.app.locals.userAgent.browser - Browser name and version
   * @param {string} req.app.locals.userAgent.os - Operating system
   * @param {Request} req.headers - Request headers
   * @param {string} [req.headers['x-real-ip']] - Real IP from reverse proxy
   * @param {string} [req.headers['x-forwarded-for']] - Forwarded IP address
   * @param {string} req.ip - Remote IP address
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   *
   * @throws {Error} When passwords don't match (400 Bad Request)
   * @throws {Error} When password doesn't meet security requirements (422 Unprocessable Entity)
   * @throws {Error} When password reset service fails
   *
   * @remarks
   * - Requires prior OTP verification (userId must be in app.locals)
   * - Both newPassword and confirmPassword must match
   * - Password must meet complexity requirements (handled by validator)
   * - Logs reset activity with browser, OS, IP, and timestamp
   * - Invalidates all existing sessions/tokens after reset
   * - Returns 200 OK on successful password reset
   * - User must login again with new password
   *
   * @security
   * - Password is hashed before storage
   * - Activity logging helps detect unauthorized password resets
   * - IP address is extracted from headers (considering proxy)
   * - All existing tokens are revoked to force re-authentication
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

      await authenticationService.resetPassword(userId, confirmPassword, {
        browser: userAgent.browser,
        os: userAgent.os,
        ip: ip as string,
        timestamp: new Date().toISOString(),
      });

      responseUtil.sendSuccess(
        res,
        { message: 'Password reset successful' },
        String(StatusCodes.OK),
      );
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
