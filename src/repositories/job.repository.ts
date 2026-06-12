import type { estypes } from '@elastic/elasticsearch';
import { JobType, Prisma } from '@prisma/client';
import { elasticsearch, prisma } from '@work-whiz/libs';
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

const isSearchQuery = (
  query: estypes.QueryDslQueryContainer | undefined,
): query is estypes.QueryDslQueryContainer => query !== undefined;

const toJobDTO = (
  job: Prisma.JobGetPayload<{
    include: {
      employer: {
        include: {
          user: { select: typeof userSelectWithoutPassword };
        };
      };
    };
  }>,
): IJob => ({
  ...toIJobDTO({
    ...job,
    type: jobTypeFromPrisma(job.type),
  } as unknown as IJob),
  employerId: job.employerId,
});

class JobRepository implements IJobRepository {
  private static instance: JobRepository;
  protected client: PrismaRepositoryClient;

  private readonly jobIndex = 'jobs';
  private jobIndexReady = false;

  private readonly jobIndexMappings: estypes.MappingTypeMapping = {
    properties: {
      id: { type: 'keyword' },
      title: {
        type: 'text',
        fields: { keyword: { type: 'keyword', ignore_above: 256 } },
      },
      description: { type: 'text' },
      responsibilities: { type: 'text' },
      requirements: { type: 'keyword' },
      benefits: { type: 'keyword' },
      location: {
        type: 'text',
        fields: { keyword: { type: 'keyword', ignore_above: 256 } },
      },
      type: { type: 'keyword' },
      vacancy: { type: 'integer' },
      deadline: { type: 'date' },
      tags: { type: 'keyword' },
      employerId: { type: 'keyword' },
      employerName: {
        type: 'text',
        fields: { keyword: { type: 'keyword', ignore_above: 256 } },
      },
      views: { type: 'integer' },
      isPublic: { type: 'boolean' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  };

  private toJobSearchDocument(job: IJob) {
    const employer = job.employer as
      | (IJob['employer'] & { user?: { name?: string } })
      | undefined;

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      responsibilities: job.responsibilities ?? [],
      requirements: job.requirements ?? [],
      benefits: job.benefits ?? [],
      location: job.location,
      type: job.type,
      vacancy: job.vacancy,
      deadline: job.deadline,
      tags: job.tags ?? [],
      employerId: job.employerId,
      employerName: employer?.name ?? employer?.user?.name,
      employer: job.employer,
      views: job.views,
      isPublic: job.isPublic,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }

  private async ensureJobIndex(): Promise<void> {
    if (this.jobIndexReady) return;

    const exists = await elasticsearch.indices.exists({ index: this.jobIndex });

    if (!exists) {
      await elasticsearch.indices.create({
        index: this.jobIndex,
        mappings: this.jobIndexMappings,
      });
    }

    this.jobIndexReady = true;
  }

  private async indexJob(job: IJob): Promise<void> {
    await this.ensureJobIndex();
    await elasticsearch.index({
      index: this.jobIndex,
      id: job.id,
      document: this.toJobSearchDocument(job),
    });
  }

  private async indexJobBestEffort(job: IJob): Promise<void> {
    try {
      await this.indexJob(job);
    } catch (error) {
      metrics.increment('job.index.error');
      console.error('[Elasticsearch] Failed to index job:', error);
    }
  }

  private async deleteJobFromIndex(jobId: string): Promise<void> {
    await this.ensureJobIndex();
    await elasticsearch
      .delete({
        index: this.jobIndex,
        id: jobId,
      })
      .catch(error => {
        if (error?.meta?.statusCode !== 404) throw error;
      });
  }

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
    if (query.title)
      where.title = { contains: query.title, mode: 'insensitive' };
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

      const dto = toJobDTO(job);

      await this.indexJobBestEffort(dto);

      metrics.timing('job.create', Date.now() - startTime);
      return dto;
    } catch (error: unknown) {
      metrics.increment('job.create.error');
      throw this.handleError('create', error);
    }
  };

  public search = async (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedJobs> => {
    const pagination = new Pagination(options);

    try {
      const startTime = Date.now();
      await this.ensureJobIndex();

      const filter: Array<estypes.QueryDslQueryContainer | undefined> = [
        query.isPublic !== undefined
          ? { term: { isPublic: query.isPublic } }
          : undefined,
        query.location ? { match: { location: query.location } } : undefined,
        query.type?.length ? { terms: { type: query.type } } : undefined,
        query.tags?.length ? { terms: { tags: query.tags } } : undefined,
        query.employerId
          ? { term: { employerId: query.employerId } }
          : undefined,
      ];

      const result = await elasticsearch.search<IJob>({
        index: this.jobIndex,
        from: pagination.getOffset(),
        size: pagination.limit,
        query: {
          bool: {
            must: [
              query.title
                ? {
                    multi_match: {
                      query: query.title,
                      fields: [
                        'title^3',
                        'description',
                        'tags^2',
                        'employerName',
                      ],
                      fuzziness: 'AUTO',
                    },
                  }
                : { match_all: {} },
            ],
            filter: filter.filter(isSearchQuery),
          },
        },
      });

      const jobs = result.hits.hits
        .map(hit => hit._source)
        .filter(Boolean) as IJob[];

      const total =
        typeof result.hits.total === 'number'
          ? result.hits.total
          : (result.hits.total?.value ?? 0);

      metrics.timing('job.search', Date.now() - startTime);

      return {
        jobs,
        total,
        totalPages: pagination.getTotalPages(total),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error: unknown) {
      metrics.increment('job.search.error');
      throw this.handleError('search', error);
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

      const dto = toJobDTO(updatedJob);

      await this.indexJobBestEffort(dto);

      metrics.timing('job.update', Date.now() - startTime);
      return dto;
    } catch (error: unknown) {
      metrics.increment('job.update.error');
      throw this.handleError('update', error);
    }
  };

  public delete = async (jobId: string): Promise<boolean> => {
    try {
      const startTime = Date.now();

      await this.client.job.delete({ where: { id: jobId } });

      await this.deleteJobFromIndex(jobId).catch(error => {
        metrics.increment('job.delete.index.error');
        console.error('[Elasticsearch] Failed to delete job from index:', error);
      });

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
