import { StatusCodes } from 'http-status-codes';
import { BaseService } from './base.service';
import {
  getLocationFromIp,
  jwtUtil,
  passwordUtil,
  cacheUtil,
} from '@work-whiz/utils';
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

  /**
   * Generates a 6-digit OTP
   */
  private generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
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

      const hashedPassword = await passwordUtil.hashSync(role, data.password);

      const newUser = await userRepository.create({
        email,
        phone,
        role,
        password: hashedPassword,
      });

      await this.createRoleSpecificUser(role, {
        ...data,
        userId: newUser.id,
      });

      const otp = this.generateOtp();
      const OTP_EXPIRATION = 10 * 60; // 10 minutes
      const cacheKey = `account_verification_otp:${newUser.email}`;
      await cacheUtil.set(cacheKey, otp, OTP_EXPIRATION);

      // Send verification email
      await authenticationQueue.add({
        email,
        subject: `Verify your ${process.env.APP_NAME} account`,
        template: {
          name: 'account_verification_otp',
          content: {
            email,
            otp,
            expiration: '10 minutes',
            appName: process.env.APP_NAME,
            role,
          },
        },
      });

      return {
        message: 'Account created successfully. Please verify your email.',
      };
    }, this.register.name);

  /**
   * Verifies account OTP and activates user, returns tokens
   * @param {string} email - User email
   * @param {string} otp - OTP code
   * @returns {Promise<{ accessToken: string; refreshToken: string }>}
   */
  public verifyAccountOtp = async (
    email: string,
    otp: string,
  ): Promise<{ accessToken: string; refreshToken: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ email });
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'User not found.',
          trace: {
            method: this.verifyAccountOtp.name,
            context: { email },
          },
        });
      }

      const cacheKey = `account_verification_otp:${email}`;
      const cachedOtp = await cacheUtil.get(cacheKey);
      
      if (!cachedOtp || cachedOtp !== otp) {
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: 'Invalid or expired OTP.',
          trace: {
            method: this.verifyAccountOtp.name,
            context: { email },
          },
        });
      }

      await userRepository.update(user.id, { isVerified: true });
      await cacheUtil.delete(cacheKey);

      const [accessToken, refreshToken] = await Promise.all([
        jwtUtil.generate({ id: user.id, role: user.role, type: 'access' }),
        jwtUtil.generate({ id: user.id, role: user.role, type: 'refresh' }),
      ]);

      return { accessToken, refreshToken };
    }, this.verifyAccountOtp.name);

  /**
   * Logs in a user by validating credentials and generating tokens.
   *
   * @param email - The user's email
   * @param password - The user's password
   * @returns Access and refresh tokens
   *
   * @throws {ServiceError} - If credentials are invalid or account is locked
   */
  public login = async (
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> =>
    this.handleErrors(async () => {
      const INVALID_CREDENTIALS_MSG = 'Invalid username or password.';

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

      return {
        message:
          'Logged out successfully. All active sessions have been terminated.',
      };
    }, this.logout.name);

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

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    }, this.refreshToken.name);

  /**
   * Handles password reset request by sending an OTP to the user's email.
   *
   * @param email - The user's email address.
   * @returns A success message whether the email exists or not.
   *
   * @throws {ServiceError} - If the account is unverified or locked.
   */
  public forgotPassword = async (email: string): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const genericSuccessMessage =
        'If an account exists with this email, an OTP has been sent for password reset.';

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

      const otp = this.generateOtp();
      const OTP_EXPIRATION = 10 * 60; // 10 minutes
      const OTP_EXPIRATION_TEXT = '10 minutes';

      const cacheKey = `password_reset_otp:${user.id}`;
      await cacheUtil.set(cacheKey, otp, OTP_EXPIRATION);

      await authenticationQueue.add({
        email: user.email,
        subject: 'Password Reset OTP',
        template: {
          name: 'password_reset_otp',
          content: {
            email: user.email,
            otp,
            expiration: OTP_EXPIRATION_TEXT,
            appName: process.env.APP_NAME,
          },
        },
      });

      return { message: genericSuccessMessage };
    }, this.forgotPassword.name);

  /**
   * Verifies the OTP and generates a password reset token.
   *
   * @param {string} email - The user's email address.
   * @param {string} otp - The OTP entered by the user.
   * @returns {Promise<{ token: string; message: string }>} - Password reset token and success message.
   *
   * @throws {ServiceError} - If the OTP is invalid or expired.
   */
  public verifyOtp = async (
    email: string,
    otp: string,
  ): Promise<{ token: string; message: string }> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ email });
      if (!user) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'Invalid or expired OTP',
          trace: {
            method: this.verifyOtp.name,
            context: {
              email,
              error: 'User not found',
            },
          },
        });
      }

      const cacheKey = `password_reset_otp:${user.id}`;
      const cachedOtp = await cacheUtil.get(cacheKey);

      if (!cachedOtp || cachedOtp !== otp) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'Invalid or expired OTP',
          trace: {
            method: this.verifyOtp.name,
            context: {
              email,
              userId: user.id,
              error: 'OTP mismatch or not found',
            },
          },
        });
      }

      await cacheUtil.delete(cacheKey);

      const passwordResetToken = await jwtUtil.generate({
        id: user.id,
        role: user.role,
        type: 'password_reset',
      });

      const TOKEN_EXPIRATION = 15 * 60; // 15 minutes
      const tokenCacheKey = `password_reset_token:${user.id}`;
      await cacheUtil.set(tokenCacheKey, passwordResetToken, TOKEN_EXPIRATION);

      return {
        token: passwordResetToken,
        message: 'OTP verified successfully.',
      };
    }, this.verifyOtp.name);

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

      const tokenCacheKey = `password_reset_token:${user.id}`;
      const cachedToken = await cacheUtil.get(tokenCacheKey);

      if (!cachedToken) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'Invalid or expired password reset token',
          trace: {
            method: this.resetPassword.name,
            context: {
              userId,
              error: 'Token not found in cache',
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

      await cacheUtil.delete(tokenCacheKey);

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
              location: getLocationFromIp('24.48.0.1'),
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
