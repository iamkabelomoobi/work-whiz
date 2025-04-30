import { ServiceError } from '@work-whiz/errors';
import {
  IJob,
  IJobQuery,
  IJobService,
  IPaginatedJobs,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { employerRepository, jobRepository } from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';
import { cacheUtil } from '@work-whiz/utils';
import { BaseService } from './base.service';

/**
 * Service class for handling job-related operations including CRUD operations,
 * caching, and error handling.
 * @implements {IJobService}
 */
class JobService extends BaseService implements IJobService {
  private static instance: JobService;

  private readonly CACHE_TTL = {
    SINGLE_JOB: 3600,
    SEARCH_RESULTS: 300,
    EMPTY_RESULTS: 60,
  };

  /**
   * Generates a cache key for the job based on jobId
   * @param {string} jobId - The job ID of the job
   * @returns {string} The generated cache key in format 'job:{jobId}'
   */
  private generateCacheKey = (jobId: string): string => {
    return `job:${jobId}`;
  };

  /**
   * Generates a cache key for search queries
   * @param {IJobQuery} query - The search query
   * @param {IPaginationQueryOptions} options - Pagination options
   * @returns {string} The generated cache key
   */
  private generateSearchCacheKey = (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): string => {
    const queryKey = JSON.stringify(query);
    return `jobs:search:${queryKey}:page_${options.page}:limit_${options.limit}`;
  };

  /**
   * Invalidates all search caches
   * Note: In production, consider more targeted invalidation
   */
  private async invalidateSearchCaches(): Promise<void> {
    try {
      await cacheUtil.deletePattern('jobs:search:*');
    } catch (error) {
      console.error('Error invalidating search caches:', error);
    }
  }

  /**
   * Type guard to validate IPaginatedJobs structure
   */
  private isValidPaginatedJobs(data: IPaginatedJobs): data is IPaginatedJobs {
    return (
      Array.isArray(data?.jobs) &&
      typeof data?.total === 'number' &&
      typeof data?.totalPages === 'number' &&
      typeof data?.currentPage === 'number' &&
      typeof data?.perPage === 'number'
    );
  }

  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of JobService
   * @returns {JobService} The singleton instance
   */
  public static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService();
    }
    return JobService.instance;
  }

  /**
   * Creates a new job and caches it
   * @param {Partial<IJob>} data - The job data to create
   * @returns {Promise<{ message: string; job: IJob }>} Object containing success message and created job
   * @throws {ServiceError} If job creation fails
   */
  public createJob = async (
    userId: string,
    data: Partial<IJob>,
  ): Promise<{ message: string; job: IJob }> =>
    this.handleErrors(async () => {
      const employer = await employerRepository.read({ userId });

      if (!employer) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Sorry, job could not be created.',
          trace: {
            method: this.createJob.name,
            context: {
              message: `Failed to retrieve employer by userId: ${userId}`,
            },
          },
        });
      }

      if (!Array.isArray(data.responsibilities)) {
        data.responsibilities = [];
      }
      if (!Array.isArray(data.requirements)) {
        data.requirements = [];
      }
      if (!Array.isArray(data.benefits)) {
        data.benefits = [];
      }
      if (!Array.isArray(data.tags)) {
        data.tags = [];
      }

      const newJob = await jobRepository.create({
        ...data,
        employerId: employer.id,
      });
      if (!newJob) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Sorry, job could not be created.',
          trace: { method: this.createJob.name, context: { data } },
        });
      }

      const cacheKey = this.generateCacheKey(newJob.id);
      await cacheUtil.set(cacheKey, newJob, this.CACHE_TTL.SINGLE_JOB);

      return { message: 'Job created successfully.', job: newJob };
    }, this.createJob.name);

  /**
   * Finds a job by query, first checking cache
   * @param {IJobQuery} query - The query to find the job
   * @returns {Promise<IJob>} The found job
   * @throws {ServiceError} If job is not found
   */
  public findJob = async (query: IJobQuery): Promise<IJob> =>
    this.handleErrors(async () => {
      const cacheKey = this.generateCacheKey(query?.id);
      const cachedJob = await cacheUtil.get(cacheKey);

      if (cachedJob) {
        return cachedJob as IJob;
      }

      const job = await jobRepository.read(query);
      if (!job) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Sorry, job not found.',
          trace: { method: this.findJob.name, context: { query } },
        });
      }

      await cacheUtil.set(cacheKey, job, this.CACHE_TTL.SINGLE_JOB);
      return job;
    }, this.findJob.name);

  /**
   * Finds multiple jobs with pagination
   * @param {IJobQuery} query - The query to filter jobs
   * @param {IPaginationQueryOptions} options - Pagination options
   * @returns {Promise<IPaginatedJobs>} Paginated jobs result
   * @throws {ServiceError} If no jobs are found
   */
  public findJobs = async (
    query: IJobQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedJobs> =>
    this.handleErrors(async () => {
      const searchCacheKey = this.generateSearchCacheKey(query, options);
      const cachedResults = await cacheUtil.get(searchCacheKey);

      console.debug(query);

      if (cachedResults) {
        if (this.isValidPaginatedJobs(cachedResults)) {
          return cachedResults;
        }
        await cacheUtil.delete(searchCacheKey);
      }

      const payload = await jobRepository.readAll(query, options);

      if (payload.jobs.length === 0) {
        const emptyResults: IPaginatedJobs = {
          jobs: [],
          total: 0,
          totalPages: 0,
          currentPage: options.page || 1,
          perPage: options.limit || 10,
        };

        await cacheUtil.set(
          searchCacheKey,
          emptyResults,
          this.CACHE_TTL.EMPTY_RESULTS,
        );
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Sorry, no jobs available at the moment.',
          trace: { method: this.findJobs.name, context: { query } },
        });
      }

      await cacheUtil.set(
        searchCacheKey,
        payload,
        this.CACHE_TTL.SEARCH_RESULTS,
      );

      await Promise.all(
        payload.jobs.map(job =>
          cacheUtil.set(
            this.generateCacheKey(job.id),
            job,
            this.CACHE_TTL.SINGLE_JOB,
          ),
        ),
      );

      return payload;
    }, this.findJobs.name);

  /**
   * Updates a job and updates the cache
   * @param {string} jobId - ID of the job to update
   * @param {Partial<IJob>} data - Data to update
   * @returns {Promise<{ message: string; job: IJob }>} Object containing success message and updated job
   * @throws {ServiceError} If job is not found or update fails
   */
  public updateJob = async (
    jobId: string,
    data: Partial<IJob>,
  ): Promise<{ message: string; job: IJob }> =>
    this.handleErrors(async () => {
      const job = await jobRepository.read({ id: jobId });
      if (!job) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Sorry, job not found.',
          trace: { method: this.updateJob.name, context: { jobId } },
        });
      }

      const updatedJob = await jobRepository.update(jobId, data);
      if (!updatedJob) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Sorry, job could not be updated.',
          trace: { method: this.updateJob.name, context: { jobId } },
        });
      }

      const cacheKey = this.generateCacheKey(jobId);
      await cacheUtil.set(cacheKey, updatedJob, this.CACHE_TTL.SINGLE_JOB);

      await this.invalidateSearchCaches();

      return { message: 'Job updated successfully.', job: updatedJob };
    }, this.updateJob.name);

  /**
   * Deletes a job and removes it from cache
   * @param {string} jobId - ID of the job to delete
   * @returns {Promise<{ message: string }>} Success message
   * @throws {ServiceError} If job is not found or deletion fails
   */
  public deleteJob = async (jobId: string): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const job = await jobRepository.read({ id: jobId });
      if (!job) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Sorry, job not found.',
          trace: {
            method: this.deleteJob.name,
            context: { jobId },
          },
        });
      }

      const result = await jobRepository.delete(jobId);
      if (!result) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Sorry, job could not be deleted.',
          trace: {
            method: this.deleteJob.name,
            context: { jobId },
          },
        });
      }

      const cacheKey = this.generateCacheKey(jobId);
      await cacheUtil.delete(cacheKey);

      await this.invalidateSearchCaches();

      return { message: 'Job deleted successfully.' };
    }, this.deleteJob.name);
}

export const jobService = JobService.getInstance();
