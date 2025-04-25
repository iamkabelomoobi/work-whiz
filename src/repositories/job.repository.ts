import { Op, WhereOptions, Transaction } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { JobModel, EmployerModel, UserModel } from '@work-whiz/models';
import { toIJobDTO } from '@work-whiz/dtos';
import {
  IJob,
  IJobQuery,
  IJobRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';

/**
 * Interface for paginated job results
 */
interface IPaginatedJobs {
  jobs: IJob[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}

/**
 * Job repository handling all database operations for jobs
 * @implements {IJobRepository}
 */
class JobRepository implements IJobRepository {
  private static instance: JobRepository;
  protected jobModel: typeof JobModel;
  protected transaction?: Transaction;

  private constructor() {
    this.jobModel = JobModel;
  }

  /**
   * Gets the singleton instance of JobRepository
   * @returns {JobRepository} The shared repository instance
   */
  public static getInstance(): JobRepository {
    if (!JobRepository.instance) {
      JobRepository.instance = new JobRepository();
    }
    return JobRepository.instance;
  }

  /**
   * Creates a new repository instance bound to a transaction
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {JobRepository} New transactional repository instance
   */
  public withTransaction(transaction: Transaction): JobRepository {
    const repository = new JobRepository();
    repository.jobModel = this.jobModel;
    repository.transaction = transaction;
    return repository;
  }

  /**
   * Builds WHERE clause for job queries
   * @private
   * @param {IJobQuery} query - Query parameters
   * @returns {WhereOptions} Sequelize where options
   */
  private buildWhereClause = (query: IJobQuery): WhereOptions => {
    const where: WhereOptions = {};

    if (query.id) where.id = { [Op.eq]: query.id };
    if (query.title) where.title = { [Op.iLike]: `%${query.title}%` };
    if (query.employerId) where.employerId = { [Op.eq]: query.employerId };
    if (typeof query.isActive === 'boolean') {
      where.isActive = { [Op.eq]: query.isActive };
    }

    return where;
  };

  /**
   * Gets database operation options including transaction
   * @private
   * @returns {object} Sequelize options
   */
  private getOptions = () =>
    this.transaction ? { transaction: this.transaction } : {};

  /**
   * Standardizes error handling for repository operations
   * @private
   * @param {string} operation - Operation name
   * @param {unknown} error - Original error
   * @param {object} [context] - Additional context
   * @returns {RepositoryError} Formatted repository error
   */
  private handleError = (
    operation: string,
    error: unknown,
  ): RepositoryError => {
    return new RepositoryError(
      `Job ${operation} operation failed`,
      error instanceof Error ? error : new Error(String(error)),
    );
  };

  /**
   * Creates a new job record
   * @param {Partial<IJob>} data - Job data
   * @returns {Promise<IJob>} Created job DTO
   * @throws {RepositoryError} On creation failure
   */
  public create = async (data: Partial<IJob>): Promise<IJob> => {
    try {
      const startTime = Date.now();
      const job = await this.jobModel.create(data, this.getOptions());

      metrics.timing('job.create', Date.now() - startTime);
      return toIJobDTO(job.get({ plain: true }));
    } catch (error: unknown) {
      metrics.increment('job.create.error');
      throw this.handleError('create', error);
    }
  };

  /**
   * Retrieves a single job with related employer and user info
   * @param {IJobQuery} query - Query parameters
   * @returns {Promise<IJob|null>} Job DTO or null if not found
   * @throws {RepositoryError} On query failure
   */
  public read = async (query: IJobQuery): Promise<IJob | null> => {
    try {
      const startTime = Date.now();
      const job = await this.jobModel.findOne({
        where: this.buildWhereClause(query),
        ...this.getOptions(),
        include: [
          {
            model: EmployerModel,
            as: 'employer',
            attributes: ['id', 'name', 'industry'],
            include: [
              {
                model: UserModel,
                as: 'user',
                attributes: ['email', 'phone'],
                required: true,
              },
            ],
            required: true,
          },
        ],
        rejectOnEmpty: false,
      });

      metrics.timing('job.read', Date.now() - startTime);
      return job ? toIJobDTO(job.get({ plain: true })) : null;
    } catch (error: unknown) {
      metrics.increment('job.read.error');
      throw this.handleError('read', error);
    }
  };

  /**
   * Retrieves paginated job listings with related data
   * @param {IJobQuery} query - Filter criteria
   * @param {IPaginationQueryOptions} options - Pagination config
   * @returns {Promise<IPaginatedJobs>} Paginated results
   * @throws {RepositoryError} On query failure
   */
  public readAll = async (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedJobs> => {
    const pagination = new Pagination(options);

    try {
      const startTime = Date.now();
      const { rows, count } = await this.jobModel.findAndCountAll({
        where: this.buildWhereClause(query),
        distinct: true,
        col: 'JobModel.id',
        offset: pagination.getOffset(),
        limit: pagination.limit,
        order: pagination.getOrder(),
        ...this.getOptions(),
        include: [
          {
            model: EmployerModel,
            as: 'employer',
            attributes: ['id', 'name', 'industry'],
            include: [
              {
                model: UserModel,
                as: 'user',
                attributes: ['email', 'phone'],
                required: true,
              },
            ],
            required: true,
          },
        ],
      });

      const jobs = rows.map(job => toIJobDTO(job.get({ plain: true })));

      metrics.timing('job.readAll', Date.now() - startTime);
      metrics.gauge('job.readAll.count', jobs.length);
      return {
        jobs,
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

  /**
   * Updates an existing job record
   * @param {string} id - Job ID to update
   * @param {Partial<IJob>} data - Update data
   * @returns {Promise<IJob>} Updated job DTO
   * @throws {RepositoryError} On update failure or if job not found
   */
  public update = async (id: string, data: Partial<IJob>): Promise<IJob> => {
    try {
      const startTime = Date.now();
      const [affectedRows, [updatedJob]] = await this.jobModel.update(data, {
        where: { id },
        returning: true,
        ...this.getOptions(),
      });

      if (affectedRows === 0) {
        throw new RepositoryError('Job not found');
      }

      metrics.timing('job.update', Date.now() - startTime);
      return toIJobDTO(updatedJob.get({ plain: true }));
    } catch (error: unknown) {
      metrics.increment('job.update.error');
      throw this.handleError('update', error);
    }
  };

  /**
   * Deletes a job record
   * @param {string} jobId - Job ID to delete
   * @returns {Promise<boolean>} True if deletion succeeded
   * @throws {RepositoryError} On deletion failure
   */
  public delete = async (jobId: string): Promise<boolean> => {
    try {
      const startTime = Date.now();
      const deletedRows = await this.jobModel.destroy({
        where: { id: jobId },
        ...this.getOptions(),
      });

      metrics.timing('job.delete', Date.now() - startTime);
      return deletedRows > 0;
    } catch (error: unknown) {
      metrics.increment('job.delete.error');
      throw this.handleError('delete', error);
    }
  };

  /**
   * Executes operations within a transaction
   * @template T - Return type
   * @param {(t: Transaction) => Promise<T>} work - Transactional work
   * @param {Transaction} [existingTransaction] - Existing transaction (optional)
   * @returns {Promise<T>} Work result
   * @throws {Error} Any error occurring during transaction
   */
  public async executeInTransaction<T>(
    work: (t: Transaction) => Promise<T>,
    existingTransaction?: Transaction,
  ): Promise<T> {
    if (existingTransaction) {
      return work(existingTransaction);
    }

    const transaction = await sequelize.transaction();
    try {
      const result = await work(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
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
