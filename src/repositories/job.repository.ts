import { JobType, Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import { toIJobDTO } from '@work-whiz/dtos';
import {
  IJob,
  IJobQuery,
  IJobRepository,
  IPaginatedJobs,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import {
  getPrismaOrderBy,
  PrismaRepositoryClient,
  userSelectWithoutPassword,
} from './prisma.repository';

const jobTypeToPrisma = (type?: IJob['type']): JobType | undefined => {
  if (!type) return undefined;

  const map: Record<IJob['type'], JobType> = {
    'Full-time': 'full_time',
    'Part-time': 'part_time',
    Contract: 'contract',
    Internship: 'internship',
  };

  return map[type];
};

const jobTypeFromPrisma = (type: JobType): IJob['type'] => {
  const map: Record<JobType, IJob['type']> = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contract',
    internship: 'Internship',
  };

  return map[type];
};

const toJobDTO = (job: Prisma.JobGetPayload<{
  include: {
    employer: {
      include: {
        user: { select: typeof userSelectWithoutPassword };
      };
    };
  };
}>): IJob =>
  toIJobDTO({
    ...job,
    type: jobTypeFromPrisma(job.type),
  } as unknown as IJob);

class JobRepository implements IJobRepository {
  private static instance: JobRepository;
  protected client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  public static getInstance(): JobRepository {
    if (!JobRepository.instance) {
      JobRepository.instance = new JobRepository();
    }
    return JobRepository.instance;
  }

  public withTransaction(transaction: Prisma.TransactionClient): JobRepository {
    return new JobRepository(transaction);
  }

  private buildWhereClause = (query: IJobQuery): Prisma.JobWhereInput => {
    const where: Prisma.JobWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.title) where.title = { contains: query.title, mode: 'insensitive' };
    if (query.employerId) where.employerId = query.employerId;
    if (typeof query.isPublic === 'boolean') where.isPublic = query.isPublic;
    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }
    if (query.type?.length) {
      where.type = {
        in: query.type
          .map(type => jobTypeToPrisma(type as IJob['type']))
          .filter(Boolean) as JobType[],
      };
    }
    if (query.tags?.length) where.tags = { hasSome: query.tags };
    if (query.employerName) {
      where.employer = {
        user: {
          name: {
            contains: query.employerName,
            mode: 'insensitive',
          },
        },
      };
    }

    return where;
  };

  private readonly includeEmployer = {
    employer: {
      include: {
        user: { select: userSelectWithoutPassword },
      },
    },
  } as const;

  private handleError = (
    operation: string,
    error: unknown,
  ): RepositoryError => {
    return new RepositoryError(
      `Job ${operation} operation failed`,
      error instanceof Error ? error : new Error(String(error)),
    );
  };

  private toCreateData(data: Partial<IJob>): Prisma.JobUncheckedCreateInput {
    const { type } = data;
    const job = { ...data };
    delete job.employer;
    delete job.type;

    return {
      ...job,
      type: jobTypeToPrisma(type),
    } as Prisma.JobUncheckedCreateInput;
  }

  private toUpdateData(data: Partial<IJob>): Prisma.JobUncheckedUpdateInput {
    const { type } = data;
    const job = { ...data };
    delete job.employer;
    delete job.type;

    return {
      ...job,
      ...(type ? { type: jobTypeToPrisma(type) } : {}),
    } as Prisma.JobUncheckedUpdateInput;
  }

  public create = async (data: Partial<IJob>): Promise<IJob> => {
    try {
      const startTime = Date.now();
      const job = await this.client.job.create({
        data: this.toCreateData(data),
        include: this.includeEmployer,
      });

      metrics.timing('job.create', Date.now() - startTime);
      return toJobDTO(job);
    } catch (error: unknown) {
      metrics.increment('job.create.error');
      throw this.handleError('create', error);
    }
  };

  public read = async (query: IJobQuery): Promise<IJob | null> => {
    try {
      const startTime = Date.now();
      const job = await this.client.job.findFirst({
        where: this.buildWhereClause(query),
        include: this.includeEmployer,
      });

      metrics.timing('job.read', Date.now() - startTime);
      return job ? toJobDTO(job) : null;
    } catch (error: unknown) {
      metrics.increment('job.read.error');
      throw this.handleError('read', error);
    }
  };

  public readAll = async (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedJobs> => {
    const pagination = new Pagination(options);
    const where = this.buildWhereClause(query);

    try {
      const startTime = Date.now();
      const [jobs, count] = await Promise.all([
        this.client.job.findMany({
          where,
          include: this.includeEmployer,
          skip: pagination.getOffset(),
          take: pagination.limit,
          orderBy: getPrismaOrderBy(pagination.sort),
        }),
        this.client.job.count({ where }),
      ]);

      const mappedJobs = jobs.map(toJobDTO);

      metrics.timing('job.readAll', Date.now() - startTime);
      metrics.gauge('job.readAll.count', mappedJobs.length);
      return {
        jobs: mappedJobs,
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error: unknown) {
      metrics.increment('job.readAll.error');
      throw this.handleError('readAll', error);
    }
  };

  public update = async (id: string, data: Partial<IJob>): Promise<IJob> => {
    try {
      const startTime = Date.now();
      const updatedJob = await this.client.job.update({
        where: { id },
        data: this.toUpdateData(data),
        include: this.includeEmployer,
      });

      metrics.timing('job.update', Date.now() - startTime);
      return toJobDTO(updatedJob);
    } catch (error: unknown) {
      metrics.increment('job.update.error');
      throw this.handleError('update', error);
    }
  };

  public delete = async (jobId: string): Promise<boolean> => {
    try {
      const startTime = Date.now();
      await this.client.job.delete({ where: { id: jobId } });

      metrics.timing('job.delete', Date.now() - startTime);
      return true;
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      metrics.increment('job.delete.error');
      throw this.handleError('delete', error);
    }
  };

  public async executeInTransaction<T>(
    work: (t: Prisma.TransactionClient) => Promise<T>,
    existingTransaction?: Prisma.TransactionClient,
  ): Promise<T> {
    if (existingTransaction) {
      return work(existingTransaction);
    }

    return prisma.$transaction(work);
  }
}

const metrics = {
  timing: (name: string, duration: number) =>
    console.debug(`[METRIC] ${name}: ${duration}ms`),
  increment: (name: string) =>
    console.debug(`[METRIC] ${name} count increased`),
  gauge: (name: string, value: number) =>
    console.debug(`[METRIC] ${name} = ${value}`),
};

export const jobRepository = JobRepository.getInstance();
