/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceError } from '@work-whiz/errors';
import {
  IAdmin,
  IAdminQuery,
  IAdminService,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { adminRepository } from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';

class AdminService implements IAdminService {
  private static instance: AdminService;

  private constructor() {
    //
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  private async handleErrors<T>(
    fn: () => Promise<T>,
    method: string,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      console.log(error);
      if (error instanceof ServiceError) throw error;
      throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
        message: 'An unexpected error occurred.',
        trace: {
          method,
          context: {
            error: error?.message,
            stack: error?.stack,
          },
        },
      });
    }
  }

  public findOne = async (query: IAdminQuery): Promise<IAdmin> =>
    this.handleErrors(async () => {
      const admin = await adminRepository.read(query);

      if (!admin) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Admin account not found.',
          trace: { method: this.findOne.name, context: { query } },
        });
      }
      return admin;
    }, this.findOne.name);

  public findAll = async (
    query: IAdminQuery,
    options: IPaginationQueryOptions = { page: 1, limit: 10 },
  ): Promise<{
    admins: IAdmin[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> =>
    this.handleErrors(async () => {
      const payload = await adminRepository.readAll(query, options);

      if (payload.admins.length === 0) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'No admin accounts found matching the provided query.',
          trace: {
            method: this.findAll.name,
            context: { query, options },
          },
        });
      }

      return {
        admins: payload.admins,
        pagination: {
          page: payload.currentPage,
          limit: options.limit ?? 10,
          total: payload.total,
        },
      };
    }, this.findAll.name);

  public update = async (
    id: string,
    data: Partial<IAdmin>,
  ): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const admin = await adminRepository.read({ userId: id });
      if (!admin) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Admin account not found for the provided user.',
          trace: {
            method: this.update.name,
            context: { userId: id },
          },
        });
      }

      const updatedAdmin = await adminRepository.update(admin.id, data);
      if (!updatedAdmin) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Could not update admin account.',
          trace: {
            method: this.update.name,
            context: { userId: id },
          },
        });
      }

      return { message: 'Admin account updated successfully.' };
    }, this.update.name);
}

export const adminService = AdminService.getInstance();
