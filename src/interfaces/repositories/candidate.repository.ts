import { Transaction } from 'sequelize';
import {
  ICandidate,
  ICandidateQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

/**
 * Interface defining methods for interacting with the Candidate repository.
 */
export interface ICandidateRepository {
  /**
   * Retrieves a single candidate based on the provided query.
   *
   * @param query - The conditions to filter and fetch the candidate.
   * @returns A Promise that resolves to a candidate or null if not found.
   */
  read(query: ICandidateQuery): Promise<ICandidate | null>;

  /**
   * Creates a new candidate with the provided data.
   *
   * @param candidate - The candidate data to be created.
   * @returns A Promise that resolves to the created candidate.
   */
  create(candidate: ICandidate): Promise<ICandidate>;

  /**
   * Retrieves multiple candidates with optional pagination support.
   *
   * @param query - The filtering conditions for candidates.
   * @param options - Pagination options including limit, offset, etc.
   * @returns A Promise that resolves to an object containing the candidate list and total count.
   */
  readAll(
    query: ICandidateQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    candidates: ICandidate[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }>;

  /**
   * Updates a candidate’s data with the specified fields.
   *
   * @param userId - The ID of the candidate to update.
   * @param data - Partial candidate data to be updated.
   * @returns A Promise that resolves to the updated candidate or null if not found.
   */
  update(userId: string, data: Partial<ICandidate>): Promise<ICandidate | null>;

  withTransaction(t: Transaction): ICandidateRepository;
}
