import { ServiceError } from '@work-whiz/errors';
import {
  ICandidate,
  ICandidateQuery,
  ICandidateService,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { candidateRepository } from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';
import { cacheUtil } from '@work-whiz/utils';
import { BaseService } from './base.service';

/**
 * Service class for handling candidate-related operations
 * @implements {ICandidateService}
 */
class CandidateService extends BaseService implements ICandidateService {
  private static instance: CandidateService;

  /**
   * Generates a cache key for the candidate based on userId
   * @param {string} userId - The user ID of the candidate
   * @returns {string} The generated cache key
   */
  private generateCacheKey = (userId: string): string => {
    return `candidate:${userId}`;
  };

  private constructor() {
    super();
  }

  /**
   * Gets the singleton instance of CandidateService
   * @returns {CandidateService} The service instance
   */
  public static getInstance(): CandidateService {
    if (!CandidateService.instance) {
      CandidateService.instance = new CandidateService();
    }
    return CandidateService.instance;
  }

  /**
   * Finds a single candidate by query
   * @param {ICandidateQuery} query - Search criteria
   * @returns {Promise<ICandidate | null>} Found candidate or null if not found
   * @throws {ServiceError} If candidate not found or other error occurs
   */
  public findOne = async (
    query: ICandidateQuery,
  ): Promise<ICandidate | null> => {
    return this.handleErrors(async () => {
      const cacheKey = this.generateCacheKey(query.userId);
      const cachedCandidate = await cacheUtil.get(cacheKey);

      if (cachedCandidate) {
        return cachedCandidate as ICandidate;
      }

      const candidate = await candidateRepository.read(query);
      if (!candidate) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Candidate account not found.',
          trace: { method: this.findOne.name, context: { query } },
        });
      }
      return candidate;
    }, this.findOne.name);
  };

  /**
   * Finds multiple candidates with pagination
   * @param {ICandidateQuery} query - Search criteria
   * @param {IPaginationQueryOptions} [options] - Pagination options
   * @returns {Promise<{candidates: ICandidate[], pagination: {page: number, limit: number, total: number}}>}
   * @throws {ServiceError} If no candidates found or other error occurs
   */
  public findAll = async (
    query: ICandidateQuery,
    options?: IPaginationQueryOptions,
  ): Promise<{
    candidates: ICandidate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }> => {
    return this.handleErrors(async () => {
      const payload = await candidateRepository.readAll(query, options);
      if (payload.total === 0) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'No candidates found matching the provided query.',
          trace: { method: this.findAll.name, context: { query } },
        });
      }

      return {
        candidates: payload.candidates,
        pagination: {
          page: payload.currentPage,
          limit: options?.limit ?? 10,
          total: payload.total,
        },
      };
    }, this.findAll.name);
  };

  /**
   * Updates a candidate's information
   * @param {string} userId - ID of the candidate to update
   * @param {Partial<ICandidate>} data - Data to update
   * @returns {Promise<{message: string}>} Success message
   * @throws {ServiceError} If candidate not found or other error occurs
   */
  public update = async (
    userId: string,
    data: Partial<ICandidate>,
  ): Promise<{ message: string }> => {
    return this.handleErrors(async () => {
      const candidate = await candidateRepository.read({ userId });
      if (!candidate) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Candidate account not found.',
          trace: { method: this.update.name, context: { userId } },
        });
      }

      await candidateRepository.update(userId, data);

      const cacheKey = this.generateCacheKey(candidate.userId);

      await cacheUtil.delete(cacheKey);

      return { message: 'Candidate account updated successfully.' };
    }, this.update.name);
  };
}

export const candidateService = CandidateService.getInstance();
