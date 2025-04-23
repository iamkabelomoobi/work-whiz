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
import { cacheUtil } from '@work-whiz/utils';
import { BaseService } from './base.service';

class AdminService extends BaseService implements IAdminService {
  private static instance: AdminService;

  /**
   * Generates a cache key for the admin based on userId
   * @param {string} userId - The user ID of the admin
   * @returns {string} The generated cache key
   */
  private generateCacheKey = (userId: string): string => {
    return `admin:${userId}`;
  };

  private constructor() {
    super();
  }

  public static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  /**
   * Finds an admin by query and caches result if fetched by userId.
   *
   * @param {IAdminQuery} query - Admin lookup parameters, requires `userId`.
   * @returns {Promise<IAdmin>} - Found admin.
   * @throws {ServiceError} - If admin is not found or userId is missing.
   */
  public findOne = async (query: IAdminQuery): Promise<IAdmin> =>
    this.handleErrors(async () => {
      const cacheKey = this.generateCacheKey(query.userId);
      const cachedAdmin = await cacheUtil.get(cacheKey);

      if (cachedAdmin) {
        return cachedAdmin as IAdmin;
      }

      const admin = await adminRepository.read(query);

      if (!admin) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Admin account not found.',
          trace: { method: this.findOne.name, context: { query } },
        });
      }

      await cacheUtil.set(cacheKey, admin, 3600);
      return admin;
    }, this.findOne.name);

  /**
   * Retrieves a paginated list of admins based on the provided query and pagination options.
   * Throws if no admins are found.
   *
   * @param query - The filter query for retrieving admins.
   * @param options - Optional pagination parameters (page and limit).
   * @returns An object containing admins and pagination metadata.
   */
  public findAll = async (
    query: IAdminQuery,
    options?: IPaginationQueryOptions,
  ): Promise<{
    admins: IAdmin[];
    pagination: { page: number; limit: number; total: number };
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

  /**
   * Updates an admin by userId and clears relevant cached data.
   */
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

      await adminRepository.update(admin.id, data);

      const cacheKey = this.generateCacheKey(admin.userId);
      await cacheUtil.delete(cacheKey);

      return { message: 'Admin account updated successfully.' };
    }, this.update.name);
}

export const adminService = AdminService.getInstance();
