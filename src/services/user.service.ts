import { ServiceError } from '@work-whiz/errors';
import { IUserService } from '@work-whiz/interfaces';
import { IUser } from '@work-whiz/interfaces';
import { redis } from '@work-whiz/libs';
import { userRepository } from '@work-whiz/repositories';
import { passwordUtil } from '@work-whiz/utils';
import { StatusCodes } from 'http-status-codes';

class Userservice implements IUserService {
  private static instance: Userservice;

  private constructor() {
    //
  }

  public static getInstance(): Userservice {
    if (!Userservice.instance) {
      Userservice.instance = new Userservice();
    }
    return Userservice.instance;
  }

  private async handleErrors<T>(
    fn: () => Promise<T>,
    method: string,
  ): Promise<T> {
    try {
      return await fn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'An unexpected error occurred.',
        trace: {
          method,
          context: {
            error: error.message,
            stack: error.stack,
          },
        },
      });
    }
  }

  public updateContact = async (
    id: string,
    data: Partial<IUser>,
  ): Promise<void> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id });
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'The requested user could not be found in the system.',
          trace: {
            method: this.updateContact.name,
            context: {
              error: 'User account does not exist or has been removed.',
            },
          },
        });
      }

      const [userWithSameEmail, userWithPhone] = await Promise.all([
        data.email ? userRepository.read({ email: data.email }) : null,
        data.phone ? userRepository.read({ phone: data.phone }) : null,
      ]);

      console.log(userWithPhone);
      if (userWithSameEmail && userWithSameEmail.id !== user.id) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'The provided email address is already in use.',
          trace: {
            method: this.updateContact.name,
            context: { error: 'Email address already exists' },
          },
        });
      }

      // skip if the phone hasn’t changed
      if (userWithPhone.phone === data.phone) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'The provided phone number is already in use.',
          trace: {
            method: this.updateContact.name,
            context: { error: 'Phone number already exists' },
          },
        });
      }

      const payload: Partial<IUser> = {};
      if (data.email) payload.email = data.email;
      if (data.phone) payload.phone = data.phone;

      await userRepository.update(id, payload);
    }, this.updateContact.name);

  public updatePassword = async (
    id: string,
    passwords: { currentPassword: string; newPassword: string },
  ): Promise<void> =>
    this.handleErrors(async () => {
      const user = await userRepository.read({ id });
      if (!user) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'The requested user could not be found in the system.',
          trace: {
            method: this.updatePassword.name,
            context: {
              error: 'User account does not exist or has been removed.',
            },
          },
        });
      }

      const isCurrentValid = await passwordUtil.compareSync(
        user.role,
        passwords.currentPassword,
        user.password,
      );

      if (!isCurrentValid) {
        throw new ServiceError(StatusCodes.UNAUTHORIZED, {
          message: 'The provided password is incorrect.',
          trace: {
            method: this.updatePassword.name,
            context: { error: 'Invalid password' },
          },
        });
      }

      const isSamePassword = await passwordUtil.compareSync(
        user.role,
        passwords.newPassword,
        user.password,
      );

      if (isSamePassword) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message:
            'The new password cannot be the same as the current password.',
          trace: {
            method: this.updatePassword.name,
            context: { error: 'New password is the same as current password' },
          },
        });
      }

      const hashedPassword = await passwordUtil.hashSync(
        user.role,
        passwords.newPassword,
      );

      await userRepository.update(id, { password: hashedPassword });
    }, this.updatePassword.name);

  public deleteAccount = async (id: string): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const result = await userRepository.delete(id);

      if (!result) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'User account not found or could not be deleted.',
          trace: {
            method: this.deleteAccount.name,
            context: { error: 'User account not found' },
          },
        });
      }

      await redis.del(`refresh_token${id}`);

      return { message: 'User deleted successfully' };
    }, this.deleteAccount.name);
}

export const userService = Userservice.getInstance();
