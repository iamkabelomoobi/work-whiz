import { Transaction } from 'sequelize';
import {
  ICandidate,
  ICandidateQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

export interface ICandidateRepository {
  create(candidate: ICandidate): Promise<ICandidate>;
  read(query: ICandidateQuery): Promise<ICandidate | null>;
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
  update(id: string, data: Partial<ICandidate>): Promise<ICandidate | null>;

  withTransaction(t: Transaction): ICandidateRepository;
}
