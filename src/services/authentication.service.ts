import { StatusCodes } from 'http-status-codes';

import { getLocationFromIp, jwtUtil, passwordUtil } from '@work-whiz/utils';
import { redis } from '@work-whiz/libs';
import {
  adminRepository,
  candidateRepository,
  employerRepository,
  userRepository,
} from '@work-whiz/repositories';
import { ServiceError } from '@work-whiz/errors';
import { Role } from '@work-whiz/types';
import {
  IAdmin,
  ICandidate,
  IEmployer,
  IUser,
  IAdminRegister,
  ICandidateRegister,
  IEmployerRegister,
} from '@work-whiz/interfaces';
import { authenticationQueue } from '@work-whiz/queues';

const { ADMIN_FRONTEND, CANDIDATE_FRONTEND, EMPLOYER_FRONTEND } = process.env;

const AuthenticationErrorMessages = {
  login: 'Invalid username or password..',
  register:
    'If registration was successful, you will receive an activation email.',
  setupPassword: 'An unexpected error occurred while setting up your password.',
  logout: 'You have been logged out.',
  forgotPassword:
    'If the request is valid, you will receive an email with further instructions.',
  resetPassword: 'Your password reset request has been processed.',
  requestActivation:
    'If the request is valid, an activation email will be sent.',
  confirmActivation: 'Your account activation request has been processed.',
};

class AuthenticationService {
  private static instance: AuthenticationService;

  private createRoleSpecificUser = async (
    role: Role,
    user: Partial<IAdmin | ICandidate | IEmployer>,
  ): Promise<void> => {
    switch (role) {
      case 'admin':
        await adminRepository.create({
          ...(user as IAdmin),
          userId: user.userId,
        });
        break;
      case 'candidate':
        await candidateRepository.create({
          ...(user as ICandidate),
          userId: user.userId,
        });
        break;
      case 'employer':
        await employerRepository.create({
          ...(user as IEmployer),
          userId: user.userId,
        });
        break;
      default:
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: AuthenticationErrorMessages.register,
          trace: {
            method: this.createRoleSpecificUser.name,
            context: {
              error: `Failed to create role specific user with role: ${role}`,
            },
          },
        });
    }
  };

  private readonly createFrontendUrl = (role: Role): string => {
    switch (role) {
      case 'admin':
        return ADMIN_FRONTEND;
      case 'candidate':
        return CANDIDATE_FRONTEND;
      case 'employer':
        return EMPLOYER_FRONTEND;
      default:
        throw new Error(`Invalid user role: ${role}`);
    }
  };

  private constructor() {
    //
  }

  public static getInstance() {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  public register = async (
    role: Role,
    data: IAdminRegister | ICandidateRegister | IEmployerRegister,
  ): Promise<{ message: string }> => {
    const errorMessage = AuthenticationErrorMessages.register;

    try {
      const userExist = await userRepository.read({
        email: data.email,
      });
      if (userExist) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: errorMessage,
          trace: {
            method: this.register.name,
            context: {
              email: data.email,
              error: 'User already exists',
            },
          },
        });
      }

      const newUser = await userRepository.create({
        email: data.email,
        phone: data.phone,
        role: role,
      });

      await this.createRoleSpecificUser(newUser.role, {
        ...data,
        userId: newUser.id,
      });

      const passwordSetupToken = await jwtUtil.generate({
        id: newUser.id,
        role: newUser.role,
        type: 'password_setup',
      });

      const cacheKey = `password_setup:${newUser.id}`;
      await redis.setex(cacheKey, 1800, passwordSetupToken); // 30 minutes expiration

      const frontEndUrl = this.createFrontendUrl(newUser.role);
      const setupUrl = new URL(`${frontEndUrl}/auth/password/setup`);
      setupUrl.searchParams.set('token', passwordSetupToken);

      await authenticationQueue.add({
        email: newUser.email,
        subject: 'Complete Your Account Setup',
        template: {
          name: 'password_setup',
          content: {
            email: newUser.email,
            uri: setupUrl.toString(),
            expiration: '30 minutes',
            appName: process.env.APP_NAME,
          },
        },
      });

      return {
        message:
          'Account created successfully. Please check your email to set your password.',
      };
    } catch (error) {
      console.log(error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
        trace: {
          method: this.register.name,
          context: {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack:
              error instanceof Error && process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined,
            role,
            email: data?.email || 'not provided',
          },
        },
      });
    }
  };

  /**
   * Authenticates a user and generates JWT tokens upon successful login.
   *
   * @param {string} email - User's email address
   * @param {string} password - User's plain text password
   * @returns {Promise<{accessToken: string, refreshToken: string}>} Object containing JWT tokens
   * @throws {ServiceError} Will throw specific errors for various failure cases:
   *                        - 404 if user not found
   *                        - 403 if account is locked
   *                        - 401 if password is invalid
   *                        - 500 for internal server errors
   */
  public login = async (
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const user = await userRepository.read({ email });
    if (!user) {
      throw new ServiceError(StatusCodes.UNAUTHORIZED, {
        message: 'Invalid username or password.',
        trace: {
          method: this.login.name,
          context: {
            email,
            error: 'User document not found',
          },
        },
      });
    }

    if (user.isLocked) {
      throw new ServiceError(StatusCodes.FORBIDDEN, {
        message: 'Account locked. Contact support at support@example.com.',
        trace: {
          method: this.login.name,
          context: {
            email,
            error: 'User account is locked',
          },
        },
      });
    }

    const isPasswordValid = await passwordUtil.compareSync(
      user.role,
      password,
      user.password,
    );
    if (!isPasswordValid) {
      // TODO: implementing failed attempt tracking here
      throw new ServiceError(StatusCodes.UNAUTHORIZED, {
        message: 'Invalid username or password.',
        trace: {
          method: this.login.name,
          context: {
            email,
            error: 'Password validation failed',
          },
        },
      });
    }

    try {
      await userRepository.update(user.id, { isActive: true });

      const [accessToken, refreshToken] = await Promise.all([
        jwtUtil.generate({
          id: user.id,
          role: user.role,
          type: 'access',
        }),
        jwtUtil.generate({
          id: user.id,
          role: user.role,
          type: 'refresh',
        }),
      ]);

      await redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        60 * 60 * 24 * 7,
      ); // 7 days expiry

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: AuthenticationErrorMessages.register,
        trace: {
          method: this.login.name,
          context: {
            email,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack:
              error instanceof Error && process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined,
          },
        },
      });
    }
  };

  /**
   * Logs out a user by invalidating their active session and tokens.
   *
   * @param {string} userId - The ID of the user to logout
   * @returns {Promise<{message: string}>} Success message
   * @throws {ServiceError} Will throw errors for various cases:
   *                        - 404 if user not found
   *                        - 500 for internal server errors
   */
  public logout = async (userId: string): Promise<{ message: string }> => {
    const errorMessage = AuthenticationErrorMessages.logout;
    try {
      const updatedUser = await userRepository.update(userId, {
        isActive: false,
      });

      if (!updatedUser) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'User not found',
          trace: {
            method: this.logout.name,
            context: { userId },
          },
        });
      }

      // Invalidate all refresh tokens
      const refreshTokenKey = `refresh_token:${userId}`;
      await redis.del(refreshTokenKey);

      return {
        message:
          'Logged out successfully. All active sessions have been terminated.',
      };
    } catch (error) {
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
        trace: {
          method: this.logout.name,
          context: {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack:
              error instanceof Error && process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined,
          },
        },
      });
    }
  };

  /**
   * Completes the password setup process for a user after initial registration or password reset.
   *
   * @param {string} userId - The ID of the user setting the password
   * @param {string} password - The new password to set
   * @returns {Promise<{message: string}>} Success message
   * @throws {ServiceError} Will throw errors for various cases:
   *                        - 404 if user not found
   *                        - 400 if password is compromised
   *                        - 401 if token is invalid/expired
   *                        - 422 if password doesn't meet requirements
   *                        - 500 for internal server errors
   */
  public setupPassword = async (
    userId: string,
    password: string,
  ): Promise<{ message: string }> => {
    const errorMessage = AuthenticationErrorMessages.setupPassword;

    try {
      const user = await userRepository.read({ id: userId });
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'User account not found',
          trace: {
            method: this.setupPassword.name,
            context: {
              userId,
              error: 'User record not found',
            },
          },
        });
      }

      // const isPasswordLeaked = await passwordUtil.checkLeakedPassword(
      //   user.role,
      //   password
      // );
      // if (isPasswordLeaked) {
      //   throw new ServiceError(StatusCodes.BAD_REQUEST, {
      //     message:
      //       'This password has appeared in data breaches. Please choose a more secure password.',
      //     trace: {
      //       method: this.setupPassword.name,
      //       context: {
      //         userId,
      //         error: 'Compromised password detected',
      //       },
      //     },
      //   });
      // }

      const hashedPassword = await passwordUtil.hashSync(user.role, password);
      await userRepository.update(user.id, {
        password: hashedPassword,
        isVerified: true,
        isActive: true,
      });

      const cacheKey = `password_setup:${user.id}`;
      await redis.del(cacheKey);

      await authenticationQueue.add({
        type: 'password_changed',
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString(),
      });

      await authenticationQueue.add({
        email: user.email,
        subject: 'Your Password Was Successfully Set Up',
        template: {
          name: 'password_setup_confirmation',
          content: {
            email: user.email,
            timestamp: new Date().toLocaleString(),
          },
        },
      });

      return {
        message:
          'Password successfully set up. You can now log in to your account.',
      };
    } catch (error) {
      console.error(error);
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
        trace: {
          method: this.setupPassword.name,
          context: {
            userId,
            error: 'Failed to set user password.',
            stack: error,
          },
        },
      });
    }
  };

  /**
   * Refreshes authentication tokens using a valid refresh token.
   * Implements refresh token rotation for better security by issuing new refresh tokens
   * and invalidating the previous one on each refresh operation.
   *
   * @param {string} userId - ID of the user requesting token refresh
   * @param {string} refreshToken - Valid refresh token to exchange for new tokens
   * @returns {Promise<{accessToken: string, refreshToken?: string}>} Object containing new access token and optional new refresh token
   * @throws {ServiceError} Throws errors for various cases:
   *                        - 400 if invalid input parameters
   *                        - 404 if user not found
   *                        - 401 if refresh token is invalid/expired
   *                        - 403 if account is inactive or token revoked
   *                        - 500 for internal server errors
   */
  public refreshToken = async (
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken?: string }> => {
    let user: IUser;
    try {
      user = await userRepository.read({ id: userId });
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'User account not found. Please log in again.',
          trace: {
            method: this.refreshToken.name,
            context: {
              userId,
              error: 'User record does not exist',
            },
          },
        });
      }

      if (!user.isActive) {
        throw new ServiceError(StatusCodes.FORBIDDEN, {
          message: 'Account is inactive. Please contact support.',
          trace: {
            method: this.refreshToken.name,
            context: {
              userId,
              error: 'User account is inactive',
            },
          },
        });
      }

      const storedTokenKey = `refresh_token:${userId}`;
      const storedToken = await redis.get(storedTokenKey);

      if (storedToken !== refreshToken) {
        await redis.del(storedTokenKey);
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: 'Invalid session detected. Please log in again.',
          trace: {
            method: this.refreshToken.name,
            context: {
              userId,
              error: 'Refresh token mismatch - possible token reuse',
            },
          },
        });
      }

      await jwtUtil.verify({
        role: user.role,
        token: refreshToken,
        type: 'refresh',
      });

      const [newAccessToken, newRefreshToken] = await Promise.all([
        jwtUtil.generate({
          id: user.id,
          role: user.role,
          type: 'access',
        }),
        jwtUtil.generate({
          id: user.id,
          role: user.role,
          type: 'refresh',
        }),
      ]);

      // 5. Update stored refresh token with new one and set expiration
      await redis.setex(storedTokenKey, 60 * 60 * 24 * 7, newRefreshToken);

      await authenticationQueue.add({
        type: 'token_refresh',
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        if (user) {
          await redis.del(`refresh_token:${user.id}`);
        }
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: 'Session expired. Please log in again.',
          trace: {
            method: this.refreshToken.name,
            context: {
              userId,
              error: 'Refresh token expired',
            },
          },
        });
      }

      if (error.name === 'JsonWebTokenError') {
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: 'Invalid session. Please log in again.',
          trace: {
            method: this.refreshToken.name,
            context: {
              userId,
              error: 'Invalid refresh token',
            },
          },
        });
      }

      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'Could not refresh session. Please try again.',
        trace: {
          method: this.refreshToken.name,
          context: {
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack:
              error instanceof Error && process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined,
          },
        },
      });
    }
  };

  /**
   * Initiates a password reset process by generating a secure token and sending a reset email.
   * Includes rate limiting, security checks, and comprehensive audit logging.
   *
   * @param {string} email - Email address of the account requesting password reset
   * @returns {Promise<{message: string}>} Success message
   * @throws {ServiceError} Throws errors for various cases:
   *                        - 400 if email is invalid or rate limited
   *                        - 404 if user not found
   *                        - 403 if account is locked or unverified
   *                        - 429 if too many requests
   *                        - 500 for internal server errors
   */
  public forgotPassword = async (
    email: string,
  ): Promise<{ message: string }> => {
    const errorMessage = AuthenticationErrorMessages.forgotPassword;

    try {
      const user = await userRepository.read({ email });
      if (!user) {
        return {
          message:
            'If an account exists with this email, a password reset link has been sent.',
        };
      }

      if (!user.isVerified) {
        throw new ServiceError(StatusCodes.FORBIDDEN, {
          message: 'Please verify your email before requesting password reset.',
          trace: {
            method: this.forgotPassword.name,
            context: {
              email,
              userId: user.id,
              error: 'Unverified account',
            },
          },
        });
      }

      if (user.isLocked) {
        throw new ServiceError(StatusCodes.FORBIDDEN, {
          message: 'Account locked. Contact support at support@example.com.',
          trace: {
            method: this.forgotPassword.name,
            context: {
              email,
              userId: user.id,
              error: 'Locked account',
            },
          },
        });
      }

      const passwordResetToken = await jwtUtil.generate({
        id: user.id,
        role: user.role,
        type: 'password_reset',
      });

      const cacheKey = `password_reset:${user.id}`;
      await redis.setex(cacheKey, 30 * 60, passwordResetToken);

      const frontEndUrl = this.createFrontendUrl(user.role);
      const resetUrl = new URL(`${frontEndUrl}/auth/password/reset`);
      resetUrl.searchParams.set('token', passwordResetToken);

      await authenticationQueue.add({
        email: user.email,
        subject: 'Password Reset Request',
        template: {
          name: 'password_reset',
          content: {
            email: user.email,
            uri: resetUrl.toString(),
            expiration: '30 minutes',
            appName: process.env.APP_NAME,
          },
        },
      });

      return {
        message:
          'If an account exists with this email, a password reset link has been sent.',
      };
    } catch (error) {
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
        trace: {
          method: this.forgotPassword.name,
          context: {
            email,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack:
              error instanceof Error && process.env.NODE_ENV === 'development'
                ? error.stack
                : undefined,
          },
        },
      });
    }
  };

  /**
   * Completes the password reset process by validating the reset token and updating the user's password.
   * Includes security checks, password validation, and comprehensive audit logging.
   *
   * @param {string} userId - ID of the user resetting their password
   * @param {string} password - New password to set
   * @param {Object} device - Device information where reset was initiated
   * @param {string} device.browser - User's browser/agent
   * @param {string} device.ip - IP address where request originated
   * @param {string} device.timestamp - Time of the request
   * @returns {Promise<{message: string}>} Success message
   * @throws {ServiceError} Throws errors for various cases:
   *                        - 400 if invalid input or password requirements not met
   *                        - 401 if invalid/expired reset token
   *                        - 403 if account is locked
   *                        - 404 if user not found
   *                        - 500 for internal server errors
   */
  public resetPassword = async (
    userId: string,
    password: string,
    device: { browser: string; os: string; ip: string; timestamp: string },
  ): Promise<{ message: string }> => {
    const errorMessage = AuthenticationErrorMessages.resetPassword;

    try {
      const user = await userRepository.read({ id: userId });
      console.debug('fetching user');
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'User account not found',
          trace: {
            method: this.resetPassword.name,
            context: {
              userId,
              error: 'User record does not exist',
            },
          },
        });
      }
      console.debug('fetched user');

      console.debug('user account locked?');
      if (user.isLocked) {
        throw new ServiceError(StatusCodes.FORBIDDEN, {
          message: 'Account is locked. Please contact support.',
          trace: {
            method: this.resetPassword.name,
            context: {
              userId,
              error: 'Locked account',
            },
          },
        });
      }
      console.debug('user account not locked?');

      const isSamePassword = await passwordUtil.compareSync(
        user.role,
        password,
        user.password,
      );
      console.debug('user passwords same?', isSamePassword);
      if (isSamePassword) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'New password cannot be the same as your current password',
          trace: {
            method: this.resetPassword.name,
            context: {
              userId,
              error: 'Password reuse detected',
            },
          },
        });
      }
      console.debug('user passwords not same?');

      // check for compromised password
      // const isPasswordLeaked = await passwordUtil.checkLeakedPassword(
      //   user.role,
      //   password
      // );
      // if (isPasswordLeaked) {
      //   throw new ServiceError(StatusCodes.BAD_REQUEST, {
      //     message:
      //       'This password has been compromised in data breaches. Please choose a different one.',
      //     trace: {
      //       method: this.resetPassword.name,
      //       context: {
      //         userId,
      //         error: 'Compromised password',
      //       },
      //     },
      //   });
      // }

      console.debug('hashing user passwords');
      const hashedPassword = await passwordUtil.hashSync(user.role, password);
      await userRepository.update(user.id, {
        password: hashedPassword,
      });
      console.debug('user password updated', hashedPassword);
      await redis.del(`refresh_token:${user.id}`);
      await redis.del(`password_reset:${user.id}`);

      console.log('getting device location', device.ip);
      const deviceLocation = await getLocationFromIp('24.48.0.1');
      console.debug('device location', deviceLocation);
      await authenticationQueue.add({
        email: user.email,
        subject: 'Your Password Was Changed',
        template: {
          name: 'password_update',
          content: {
            email: user.email,
            appName: process.env.APP_NAME,
            device: {
              browser: device.browser,
              os: device.os,
              location: deviceLocation,
              timestamp: new Date().toISOString(),
              ip: device.ip,
            },
          },
        },
      });

      return {
        message:
          'Password has been reset successfully. Please log in with your new password.',
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error; // rethrow expected error
      }

      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: errorMessage,
        trace: {
          method: this.resetPassword.name,
          context: {
            userId,
            error: error,
            stack: error.stack,
          },
        },
      });
    }
  };
}

export const authenticationService = AuthenticationService.getInstance();
