import { JobType, Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import { toApplicationDTO } from '@work-whiz/dtos';
import { RepositoryError } from '@work-whiz/errors';
import {
  IApplication,
  IApplicationQuery,
  IPaginatedApplications,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { IApplicationRepository } from '@work-whiz/interfaces/repositories';
import { Pagination } from '@work-whiz/utils';
import { PrismaRepositoryClient } from './prisma.repository';

class ApplicationRepository implements IApplicationRepository {
  private static instance: ApplicationRepository;
  private client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  private buildWhereClause = (
    query: IApplicationQuery,
  ): Prisma.ApplicationWhereInput => {
    const where: Prisma.ApplicationWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.jobId) where.jobId = query.jobId;
    if (query.candidateId) where.candidateId = query.candidateId;
    if (query.status) where.status = query.status;
    if (query.createdAt) where.createdAt = new Date(query.createdAt);
    if (query.updatedAt) where.updatedAt = new Date(query.updatedAt);

    return where;
  };

  private readonly includeRelations = {
    job: true,
    candidate: true,
  } as const;

  private toDtoInput(application: unknown): IApplication {
    const dtoApplication = application as IApplication & {
      job?: IApplication['job'] & { type?: JobType };
    };
    const jobTypeMap: Record<JobType, NonNullable<IApplication['job']>['type']> = {
      full_time: 'Full-time',
      part_time: 'Part-time',
      contract: 'Contract',
      internship: 'Internship',
    };

    return {
      ...dtoApplication,
      job: dtoApplication.job
        ? {
            ...dtoApplication.job,
            type:
              dtoApplication.job.type &&
              dtoApplication.job.type in jobTypeMap
                ? jobTypeMap[dtoApplication.job.type as JobType]
                : dtoApplication.job.type,
          }
        : null,
    };
  }

  public static getInstance(): ApplicationRepository {
    if (!ApplicationRepository.instance) {
      ApplicationRepository.instance = new ApplicationRepository();
    }
    return ApplicationRepository.instance;
  }

  public withTransaction(
    transaction: Prisma.TransactionClient,
  ): IApplicationRepository {
    return new ApplicationRepository(transaction);
  }

  public async create(
    application: Omit<IApplication, 'id'>,
  ): Promise<IApplication> {
    try {
      const newApplication = await this.client.application.create({
        data: application as Prisma.ApplicationUncheckedCreateInput,
        include: this.includeRelations,
      });

      return toApplicationDTO(this.toDtoInput(newApplication));
    } catch (error) {
      throw new RepositoryError('Failed to create application', error);
    }
  }

  public async read(applicationId: string): Promise<IApplication | null> {
    try {
      const application = await this.client.application.findUnique({
        where: { id: applicationId },
        include: this.includeRelations,
      });

      return application ? toApplicationDTO(this.toDtoInput(application)) : null;
    } catch (error) {
      throw new RepositoryError('Failed to read application', error);
    }
  }

  public async readAll(
    query: IApplicationQuery,
    pagination: IPaginationQueryOptions,
  ): Promise<IPaginatedApplications> {
    const paginationObj = new Pagination(pagination);
    const where = this.buildWhereClause(query);

    try {
      const [applications, count] = await Promise.all([
        this.client.application.findMany({
          where,
          include: this.includeRelations,
          skip: paginationObj.getOffset(),
          take: paginationObj.limit,
        }),
        this.client.application.count({ where }),
      ]);

      return {
        applications: applications.map(application =>
          toApplicationDTO(this.toDtoInput(application)),
        ),
        total: count,
        page: paginationObj.page,
      };
    } catch (error) {
      throw new RepositoryError('Failed to read applications', error);
    }
  }

  public async update(
    applicationId: string,
    application: Partial<IApplication>,
  ): Promise<IApplication> {
    try {
      const updatedApplication = await this.client.application.update({
        where: { id: applicationId },
        data: application as Prisma.ApplicationUncheckedUpdateInput,
        include: this.includeRelations,
      });

      return toApplicationDTO(this.toDtoInput(updatedApplication));
    } catch (error) {
      throw new RepositoryError('Failed to update application', error);
    }
  }

  public async delete(applicationId: string): Promise<boolean> {
    try {
      await this.client.application.delete({ where: { id: applicationId } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw new RepositoryError('Failed to delete application', error);
    }
  }

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

export const applicationRepository = ApplicationRepository.getInstance();
