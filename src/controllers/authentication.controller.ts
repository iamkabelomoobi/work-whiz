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
} from '@work-whiz/validators';

const SESSION_EXPIRED_MESSAGE = 'Session has expired';

export class AuthenticationController {
  private static instance: AuthenticationController;

  private readonly REFRESH_TOKEN_COOKIE = {
    httpOnly: true,
    secure: true,
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/auth/refresh-token',
  };

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
    accessToken: string,
  ): void {
    res
      .cookie('refresh_token', refreshToken, this.REFRESH_TOKEN_COOKIE)
      .cookie('access_token', accessToken, this.ACCESS_TOKEN_COOKIE);
  }

  /**
   * Clears authentication cookies
   */
  private clearAuthCookies(res: Response): void {
    res.clearCookie('refresh_token', { path: this.REFRESH_TOKEN_COOKIE.path });
    res.clearCookie('access_token', { path: this.ACCESS_TOKEN_COOKIE.path });
  }

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
            registerData as IAdminRegister,
          );
          break;
        case 'candidate':
          registerErrors = candidateRegisterValidator(
            registerData as ICandidateRegister,
          );
          break;
        case 'employer':
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
      responseUtil.sendSuccess(res, response);
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      console.log(req.body);
      if (!email || !password) {
        responseUtil.sendError(res, {
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

  public logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.app.locals;

      const response = await authenticationService.logout(userId);

      this.clearAuthCookies(res);
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  public setupPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { password } = req.body;
      const { userId } = req.app.locals;

      const passwordError = passwordValidator(password);
      if (passwordError) {
        return responseUtil.sendError(res, {
          message: passwordError.details[0].message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      const response = await authenticationService.setupPassword(
        userId,
        password,
      );
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.clearAuthCookies(res);
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

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

      const response = await authenticationService.forgotPassword(email);
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };

  public resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId, userAgent } = req.app.locals;
      const { password } = req.body;

      const passwordError = passwordValidator(password);
      if (passwordError) {
        return responseUtil.sendError(res, {
          message: passwordError.details[0].message,
          statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        });
      }

      // Retrieve the IP header, which might contain multiple comma-separated IPs from proxies
      const ipHeader = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || req.ip;

      // Split the header on commas and take the first IP, ensuring it is trimmed of whitespace
      const ip = ipHeader.split(',')[0].trim();

      const response = await authenticationService.resetPassword(
        userId,
        password,
        {
          browser: userAgent.browser,
          os: userAgent.os,
          ip: ip as string,
          timestamp: new Date().toISOString(),
        },
      );

      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      console.error('Reset Password Error:', error); // Log the error
      responseUtil.sendError(res, {
        message:
          error.message || 'An error occurred while resetting the password',
        statusCode: error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  };
}

export const authenticationController = AuthenticationController.getInstance();
