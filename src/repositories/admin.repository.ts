import { Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import {
  IAdmin,
  IAdminQuery,
  IAdminRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { toIAdminDTO } from '@work-whiz/dtos';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import {
  getPrismaOrderBy,
  PrismaRepositoryClient,
  userSelectWithoutPassword,
} from './prisma.repository';

class AdminRepository implements IAdminRepository {
  private static instance: AdminRepository;
  protected client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  private readonly buildWhereClause = (
    query: IAdminQuery,
  ): Prisma.AdminWhereInput => {
    const where: Prisma.AdminWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.permissions) {
      where.permissions = {
        hasSome: Array.isArray(query.permissions)
          ? query.permissions
          : [query.permissions],
      };
    }
    if (query.userId) where.userId = query.userId;

    return where;
  };

  public withTransaction(transaction: Prisma.TransactionClient): AdminRepository {
    return new AdminRepository(transaction);
  }

  public static getInstance(): AdminRepository {
    if (!AdminRepository.instance) {
      AdminRepository.instance = new AdminRepository();
    }
    return AdminRepository.instance;
  }

  public async create(admin: Omit<IAdmin, 'id'>): Promise<IAdmin> {
    try {
      const newAdmin = await this.client.admin.create({
        data: admin as Prisma.AdminUncheckedCreateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toIAdminDTO(newAdmin as unknown as IAdmin);
    } catch (error) {
      throw new RepositoryError('Failed to create admin record', error);
    }
  }

  public async read(query: IAdminQuery): Promise<IAdmin | null> {
    try {
      const admin = await this.client.admin.findFirst({
        where: this.buildWhereClause(query),
        include: { user: { select: userSelectWithoutPassword } },
      });
      return admin ? toIAdminDTO(admin as unknown as IAdmin) : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve admin record', error);
    }
  }

  public async readAll(
    query: IAdminQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    admins: IAdmin[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);
    const where = this.buildWhereClause(query);

    try {
      const [admins, count] = await Promise.all([
        this.client.admin.findMany({
          where,
          include: { user: { select: userSelectWithoutPassword } },
          skip: pagination.getOffset(),
          take: pagination.limit,
          orderBy: getPrismaOrderBy(pagination.sort) || [{ createdAt: 'asc' }],
        }),
        this.client.admin.count({ where }),
      ]);

      return {
        admins: admins.map(admin => toIAdminDTO(admin as unknown as IAdmin)),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve admin records', error);
    }
  }

  public async update(id: string, data: Partial<IAdmin>): Promise<IAdmin | null> {
    try {
      const updatedAdmin = await this.client.admin.update({
        where: { id },
        data: data as Prisma.AdminUncheckedUpdateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toIAdminDTO(updatedAdmin as unknown as IAdmin);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw new RepositoryError('Failed to update admin record', error);
    }
  }
}

export const adminRepository = AdminRepository.getInstance();
