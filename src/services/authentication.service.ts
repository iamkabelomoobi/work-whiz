import { StatusCodes } from 'http-status-codes';
import { BaseService } from './base.service';
import {
  getLocationFromIp,
  jwtUtil,
  passwordUtil,
  cacheUtil,
} from '@work-whiz/utils';
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

class AuthenticationService extends BaseService {
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
    super();
  }

  public static getInstance() {
    if (!AuthenticationService.instance) {
      AuthenticationService.instance = new AuthenticationService();
    }
    return AuthenticationService.instance;
  }

  /**
   * Registers a new user with a specific role.
   * Prevents duplicate users, stores a temporary password setup token,
   * and queues an email for account completion.
   *
   * @param role - Role of the user (Admin, Candidate, or Employer)
   * @param data - Registration form data
   * @returns A success message
   */
  public register = async (
    role: Role,
    data: IAdminRegister | ICandidateRegister | IEmployerRegister,
  ): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const { email, phone } = data;
      const errorMessage = AuthenticationErrorMessages.register;

      const existingUser = await userRepository.read({ email });

      if (existingUser) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: errorMessage,
          trace: {
            method: this.register.name,
            context: { email },
          },
        });
      }

      const newUser = await userRepository.create({ email, phone, role });

      await this.createRoleSpecificUser(role, {
        ...data,
        userId: newUser.id,
      });

      const passwordSetupToken = await jwtUtil.generate({
        id: newUser.id,
        role: newUser.role,
        type: 'password_setup',
      });

      const PASSWORD_SETUP_EXPIRATION = 1800;
      const PASSWORD_SETUP_EXPIRATION_TEXT = '30 minutes';

      const cacheKey = `password_setup:${newUser.id}`;
      await cacheUtil.set(
        cacheKey,
        passwordSetupToken,
        PASSWORD_SETUP_EXPIRATION,
      );

      const setupUrl = new URL(
        `${this.createFrontendUrl(role)}/auth/password/setup`,
      );
      setupUrl.searchParams.set('token', passwordSetupToken);

      await authenticationQueue.add({
        email,
        subject: 'Complete Your Account Setup',
        template: {
          name: 'password_setup',
          content: {
            email,
            uri: setupUrl.toString(),
            expiration: PASSWORD_SETUP_EXPIRATION_TEXT,
            appName: process.env.APP_NAME,
          },
        },
      });

      return {
        message:
          'Account created successfully. Please check your email to set your password.',
      };
    }, this.register.name);

  /**
   * Authenticates a user based on email and password.
   *
   * @param {string} email - The email address of the user trying to log in.
   * @param {string} password - The password provided by the user.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} - A promise that resolves with the access and refresh tokens.
   */
  public login = async (
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> =>
    this.handleErrors(async () => {
      const INVALID_CREDENTIALS_MSG = 'Invalid username or password.';
      const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

      const user = await userRepository.read({ email });

      if (!user) {
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: INVALID_CREDENTIALS_MSG,
          trace: {
            method: this.login.name,
            context: { email, error: 'User not found' },
          },
        });
      }

      if (user.isLocked) {
        throw new ServiceError(StatusCodes.FORBIDDEN, {
          message: 'Account locked. Contact support at support@example.com.',
          trace: {
            method: this.login.name,
            context: { email, error: 'User account is locked' },
          },
        });
      }

      const isPasswordValid = await passwordUtil.compareSync(
        user.role,
        password,
        user.password,
      );

      if (!isPasswordValid) {
        // TODO: track failed attempts
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: INVALID_CREDENTIALS_MSG,
          trace: {
            method: this.login.name,
            context: { email, error: 'Invalid password' },
          },
        });
      }
      await userRepository.update(user.id, { isActive: true });

      const [accessToken, refreshToken] = await Promise.all([
        jwtUtil.generate({ id: user.id, role: user.role, type: 'access' }),
        jwtUtil.generate({ id: user.id, role: user.role, type: 'refresh' }),
      ]);

      await redis.set(
        `refresh_token:${user.id}`,
        refreshToken,
        'EX',
        REFRESH_TOKEN_TTL_SECONDS,
      );

      return { accessToken, refreshToken };
    }, this.login.name);

  /**
   * Logs out the user by setting their account as inactive and deleting associated tokens from the cache.
   *
   * @param {string} userId - The user ID of the user logging out.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the logout operation.
   *
   * @throws {ServiceError} - Throws an error if the user could not be updated or cache deletion fails.
   *
   * @example
   * const result = await authService.logout('user-id');
   */
  public logout = async (userId: string): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id: userId });
      if (!user) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'An error occurred while logging out. Please try again.',
          trace: {
            method: this.logout.name,
            context: { userId },
          },
        });
      }

      const updatedUser = await userRepository.update(userId, {
        isActive: false,
      });

      if (!updatedUser) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'An error occurred while logging out. Please try again.',
          trace: {
            method: this.logout.name,
            context: { userId },
          },
        });
      }

      const refreshTokenKey = `refresh_token:${userId}`;
      const userKey = `${updatedUser.role}:${userId}`;

      await Promise.all([
        cacheUtil.delete(userKey),
        cacheUtil.delete(refreshTokenKey),
      ]);

      return {
        message:
          'Logged out successfully. All active sessions have been terminated.',
      };
    }, this.logout.name);

  /**
   * Sets up the password for the user and updates the user's verification status.
   *
   * @param {string} userId - The ID of the user whose password is being set up.
   * @param {string} password - The password to be set for the user.
   * @returns {Promise<{ message: string }>} - A message indicating the result of the password setup operation.
   *
   * @throws {ServiceError} - Throws an error if the user account is not found or the update fails.
   *
   * @example
   * const result = await authService.setupPassword('user-id', 'newPassword');
   */
  public setupPassword = async (
    userId: string,
    password: string,
  ): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id: userId });
      if (!user) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message:
            'An error occurred while setting password. Please try again.',
          trace: {
            method: this.setupPassword.name,
            context: {
              userId,
              error: 'User record not found',
            },
          },
        });
      }

      const hashedPassword = await passwordUtil.hashSync(user.role, password);

      const updatedUser = await userRepository.update(user.id, {
        password: hashedPassword,
        isVerified: true,
      });

      if (!updatedUser) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message:
            'An error occurred while setting up your password. Please try again.',
          trace: {
            method: this.setupPassword.name,
            context: { userId },
          },
        });
      }

      const cacheKey = `password_setup:${user.id}`;
      await cacheUtil.delete(cacheKey);

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
          'Your password was successfully set up. You can now log in to your account using your new credentials.',
      };
    }, this.setupPassword.name);

  /**
   * Refreshes the user's access and refresh tokens.
   *
   * @param {string} userId - The ID of the user whose tokens are being refreshed.
   * @param {string} refreshToken - The refresh token provided by the user.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} - The new access and refresh tokens.
   *
   * @throws {ServiceError} - Throws an error if the user account is not found, inactive, or the refresh token is invalid.
   *
   * @example
   * const result = await authService.refreshToken('user-id', 'existing-refresh-token');
   */
  public refreshToken = async (
    userId: string,
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id: userId });
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

      const refreshTokenKey = `refresh_token:${userId}`;
      const cachedRefreshToken = await cacheUtil.get(refreshTokenKey);

      if (cachedRefreshToken !== refreshToken) {
        await cacheUtil.delete(refreshTokenKey);
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

      await cacheUtil.set(refreshTokenKey, newRefreshToken, 60 * 60 * 24 * 7);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }, this.refreshToken.name);

  /**
   * Handles password reset request.
   *
   * @param email - The user's email address.
   * @returns A success message whether the email exists or not.
   *
   * @throws {ServiceError} - If the account is unverified or locked.
   */
  public forgotPassword = async (email: string): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const genericSuccessMessage =
        'If an account exists with this email, a password reset link has been sent.';

      const user = await userRepository.read({ email });
      if (!user) {
        return { message: genericSuccessMessage };
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
      await cacheUtil.set(cacheKey, passwordResetToken, 30 * 60);

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

      return { message: genericSuccessMessage };
    }, this.forgotPassword.name);

  /**
   * Completes the password reset process by validating the reset token and updating the user's password.
   *
   * @param {string} userId - ID of the user resetting their password
   * @param {string} password - New password to set
   * @param {Object} device - Device information where reset was initiated
   * @param {string} device.browser - User's browser/agent
   * @param {string} device.os - Operating system
   * @param {string} device.ip - IP address where request originated
   * @param {string} device.timestamp - Time of the request
   * @returns {Promise<{message: string}>} Success message
   */
  public resetPassword = async (
    userId: string,
    password: string,
    device: { browser: string; os: string; ip: string; timestamp: string },
  ): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id: userId });
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

      const isSamePassword = await passwordUtil.compareSync(
        user.role,
        password,
        user.password,
      );
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

      const hashedPassword = await passwordUtil.hashSync(user.role, password);
      await userRepository.update(user.id, {
        password: hashedPassword,
      });

      const cacheKey = `password_reset:${user.id}`;
      await cacheUtil.delete(cacheKey);

      const deviceLocation = await getLocationFromIp(device.ip);

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
    }, this.resetPassword.name);
}

export const authenticationService = AuthenticationService.getInstance();
