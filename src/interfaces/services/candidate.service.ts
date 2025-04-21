import { ICandidate } from '../models';
import { ICandidateQuery, IPaginationQueryOptions } from '../queries';

/**
 * Interface for candidate-related service operations.
 */
export interface ICandidateService {
  /**
   * Finds a single candidate based on the provided query.
   *
   * @param query - The query conditions used to locate the candidate.
   * @returns A Promise that resolves to the candidate if found, or null.
   */
  findOne: (query: ICandidateQuery) => Promise<ICandidate | null>;

  /**
   * Finds multiple candidates based on a query with optional pagination.
   *
   * @param query - The filtering conditions for candidates.
   * @param options - Optional pagination options (limit, page, etc.).
   * @returns A Promise that resolves to a list of candidates and pagination metadata.
   */
  findAll: (
    query: ICandidateQuery,
    options?: IPaginationQueryOptions,
  ) => Promise<{
    candidates: ICandidate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
    };
  }>;

  /**
   * Updates a candidate’s information.
   *
   * @param userId - The ID of the candidate to update.
   * @param data - Partial candidate data containing fields to update.
   * @returns A Promise that resolves to an object containing a confirmation message.
   */
  update: (
    userId: string,
    data: Partial<ICandidate>,
  ) => Promise<{ message: string }>;
}
