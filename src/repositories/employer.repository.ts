import { Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import {
  IEmployer,
  IEmployerQuery,
  IEmployerRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { toIEmployerDTO } from '@work-whiz/dtos';
import {
  getPrismaOrderBy,
  PrismaRepositoryClient,
  userSelectWithoutPassword,
} from './prisma.repository';

class EmployerRepository implements IEmployerRepository {
  private static instance: EmployerRepository;
  protected client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  private readonly buildWhereClause = (
    query: IEmployerQuery,
  ): Prisma.EmployerWhereInput => {
    const where: Prisma.EmployerWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.userId) where.userId = query.userId;
    if (typeof query.name === 'string') {
      where.name = { contains: query.name, mode: 'insensitive' };
    }
    if (typeof query.industry === 'string') {
      where.industry = { contains: query.industry, mode: 'insensitive' };
    }
    if (Array.isArray(query.industry)) where.industry = { in: query.industry };
    if (typeof query.location === 'string') {
      where.location = { contains: query.location, mode: 'insensitive' };
    }
    if (typeof query.isVerified === 'boolean') where.isVerified = query.isVerified;

    return where;
  };

  public withTransaction(transaction: Prisma.TransactionClient): EmployerRepository {
    return new EmployerRepository(transaction);
  }

  public static getInstance(): EmployerRepository {
    if (!EmployerRepository.instance) {
      EmployerRepository.instance = new EmployerRepository();
    }
    return EmployerRepository.instance;
  }

  public async create(employer: Omit<IEmployer, 'id'>): Promise<IEmployer> {
    try {
      const newEmployer = await this.client.employer.create({
        data: employer as Prisma.EmployerUncheckedCreateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toIEmployerDTO(newEmployer as unknown as IEmployer);
    } catch (error) {
      throw new RepositoryError('Failed to create employer', error);
    }
  }

  public async read(query: IEmployerQuery): Promise<IEmployer | null> {
    try {
      const employer = await this.client.employer.findFirst({
        where: this.buildWhereClause(query),
        include: { user: { select: userSelectWithoutPassword } },
      });
      return employer ? toIEmployerDTO(employer as unknown as IEmployer) : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve employer', error);
    }
  }

  public async readAll(
    query: IEmployerQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    employers: IEmployer[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);
    const where = this.buildWhereClause(query);

    try {
      const [employers, count] = await Promise.all([
        this.client.employer.findMany({
          where,
          include: { user: { select: userSelectWithoutPassword } },
          skip: pagination.getOffset(),
          take: pagination.limit,
          orderBy: getPrismaOrderBy(pagination.sort),
        }),
        this.client.employer.count({ where }),
      ]);

      return {
        employers: employers.map(employer =>
          toIEmployerDTO(employer as unknown as IEmployer),
        ),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve employers', error);
    }
  }

  public async update(
    userId: string,
    data: Partial<IEmployer>,
  ): Promise<IEmployer | null> {
    try {
      const updatedEmployer = await this.client.employer.update({
        where: { userId },
        data: data as Prisma.EmployerUncheckedUpdateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toIEmployerDTO(updatedEmployer as unknown as IEmployer);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw new RepositoryError('Failed to update employer', error);
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await this.client.employer.delete({ where: { id } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw new RepositoryError('Failed to delete employer', error);
    }
  }
}

export const employerRepository = EmployerRepository.getInstance();
