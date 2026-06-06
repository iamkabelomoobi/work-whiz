import { Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import { toIUserDTO } from '@work-whiz/dtos';
import {
  IUser,
  IUserQuery,
  IUserRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { getPrismaOrderBy, PrismaRepositoryClient } from './prisma.repository';

class UserRepository implements IUserRepository {
  private static instance: UserRepository;
  protected client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  private readonly buildWhereClause = (
    query: IUserQuery,
  ): Prisma.UserWhereInput => {
    const where: Prisma.UserWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.email) where.email = query.email.toLowerCase();
    if (query.phone) where.phone = query.phone;
    if (query.role) where.role = query.role;
    if (typeof query.isActive === 'boolean') where.isActive = query.isActive;
    if (typeof query.isVerified === 'boolean')
      where.isVerified = query.isVerified;
    if (typeof query.isLocked === 'boolean') where.isLocked = query.isLocked;

    return where;
  };

  private readonly toDtoInput = (user: unknown): IUser => {
    const dtoUser = user as Partial<IUser>;

    return {
      ...dtoUser,
      image: dtoUser.image || '',
      name: dtoUser.name || '',
      emailVerified: dtoUser.emailVerified || false,
      password: dtoUser.password || '',
    } as IUser;
  };

  public withTransaction(
    transaction: Prisma.TransactionClient,
  ): UserRepository {
    return new UserRepository(transaction);
  }

  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  public async create(user: Partial<IUser>): Promise<IUser> {
    try {
      const newUser = await this.client.user.create({
        data: user as Prisma.UserUncheckedCreateInput,
      });

      return toIUserDTO(this.toDtoInput(newUser));
    } catch (error) {
      throw new RepositoryError('Failed to create user', error);
    }
  }

  public async read(query: IUserQuery): Promise<IUser> {
    try {
      const user = await this.client.user.findFirst({
        where: this.buildWhereClause(query),
      });

      if (!user) {
        throw new RepositoryError('User not found');
      }

      return toIUserDTO(this.toDtoInput(user));
    } catch (error) {
      throw new RepositoryError('Failed to retrieve user', error);
    }
  }

  public async readAll(
    query: IUserQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    users: IUser[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);
    const where = this.buildWhereClause(query);

    try {
      const [users, count] = await Promise.all([
        this.client.user.findMany({
          where,
          skip: pagination.getOffset(),
          take: pagination.limit,
          orderBy: getPrismaOrderBy(pagination.sort),
        }),
        this.client.user.count({ where }),
      ]);

      return {
        users: users.map(user => toIUserDTO(this.toDtoInput(user))),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve users', error);
    }
  }

  public async update(id: string, data: Partial<IUser>): Promise<IUser> {
    try {
      const updatedUser = await this.client.user.update({
        where: { id },
        data: data as Prisma.UserUncheckedUpdateInput,
      });

      return toIUserDTO(this.toDtoInput(updatedUser));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new RepositoryError('User not found', error);
      }
      throw new RepositoryError('Failed to update user', error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.client.user.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw new RepositoryError('Failed to delete user', error);
    }
  }
}

export const userRepository = UserRepository.getInstance();
