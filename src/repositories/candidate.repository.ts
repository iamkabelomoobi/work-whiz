import { Prisma } from '@prisma/client';
import { prisma } from '@work-whiz/libs';
import {
  ICandidate,
  ICandidateQuery,
  ICandidateRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { toICandidateDTO } from '@work-whiz/dtos';
import {
  getPrismaOrderBy,
  PrismaRepositoryClient,
  userSelectWithoutPassword,
} from './prisma.repository';

class CandidateRepository implements ICandidateRepository {
  private static instance: CandidateRepository;
  protected client: PrismaRepositoryClient;

  private constructor(client: PrismaRepositoryClient = prisma) {
    this.client = client;
  }

  private readonly buildWhereClause = (
    query: ICandidateQuery,
  ): Prisma.CandidateWhereInput => {
    const where: Prisma.CandidateWhereInput = {};

    if (query.id) where.id = query.id;
    if (query.userId) where.userId = query.userId;
    if (typeof query.title === 'string') where.title = query.title;
    if (Array.isArray(query.title)) where.title = { in: query.title };
    if (query.skills) {
      if ('overlaps' in query.skills && query.skills.overlaps) {
        where.skills = { hasSome: query.skills.overlaps };
      } else if ('contains' in query.skills && query.skills.contains) {
        where.skills = { hasEvery: query.skills.contains };
      } else if ('any' in query.skills && query.skills.any) {
        where.skills = { has: query.skills.any };
      } else if ('all' in query.skills && query.skills.all) {
        where.skills = { hasEvery: query.skills.all };
      }
    }
    if (typeof query.isEmployed === 'boolean') where.isEmployed = query.isEmployed;

    return where;
  };

  public withTransaction(
    transaction: Prisma.TransactionClient,
  ): ICandidateRepository {
    return new CandidateRepository(transaction);
  }

  public static getInstance(): CandidateRepository {
    if (!CandidateRepository.instance) {
      CandidateRepository.instance = new CandidateRepository();
    }
    return CandidateRepository.instance;
  }

  public async create(candidate: ICandidate): Promise<ICandidate> {
    try {
      const newCandidate = await this.client.candidate.create({
        data: candidate as Prisma.CandidateUncheckedCreateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toICandidateDTO(newCandidate as unknown as ICandidate);
    } catch (error) {
      throw new RepositoryError('Failed to create candidate', error);
    }
  }

  public async read(query: ICandidateQuery): Promise<ICandidate | null> {
    try {
      const candidate = await this.client.candidate.findFirst({
        where: this.buildWhereClause(query),
        include: { user: { select: userSelectWithoutPassword } },
      });
      return candidate
        ? toICandidateDTO(candidate as unknown as ICandidate)
        : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve candidate', error);
    }
  }

  public readAll = async (
    query: ICandidateQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    candidates: ICandidate[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> => {
    const pagination = new Pagination(options);
    const where = this.buildWhereClause(query);

    try {
      const [candidates, count] = await Promise.all([
        this.client.candidate.findMany({
          where,
          include: { user: { select: userSelectWithoutPassword } },
          skip: pagination.getOffset(),
          take: pagination.limit,
          orderBy: getPrismaOrderBy(pagination.sort),
        }),
        this.client.candidate.count({ where }),
      ]);

      return {
        candidates: candidates.map(candidate =>
          toICandidateDTO(candidate as unknown as ICandidate),
        ),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve candidates', error);
    }
  };

  public async update(
    userId: string,
    data: Partial<ICandidate>,
  ): Promise<ICandidate | null> {
    try {
      const updatedCandidate = await this.client.candidate.update({
        where: { userId },
        data: data as Prisma.CandidateUncheckedUpdateInput,
        include: { user: { select: userSelectWithoutPassword } },
      });

      return toICandidateDTO(updatedCandidate as unknown as ICandidate);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return null;
      }
      throw new RepositoryError('Failed to update candidate', error);
    }
  }

  public async delete(userId: string): Promise<boolean> {
    try {
      await this.client.candidate.delete({ where: { userId } });
      return true;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        return false;
      }
      throw new RepositoryError('Failed to delete candidate', error);
    }
  }
}

export const candidateRepository = CandidateRepository.getInstance();
