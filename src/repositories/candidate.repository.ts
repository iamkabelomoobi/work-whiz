import { Op, WhereOptions, Transaction } from 'sequelize';
import { CandidateModel, UserModel } from '@work-whiz/models';
import {
  ICandidate,
  ICandidateQuery,
  ICandidateRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { sequelize } from '@work-whiz/libs';
import { toICandidateDTO } from '@work-whiz/dtos';

/**
 * Repository class for handling Candidate entity database operations
 * @class CandidateRepository
 * @implements {ICandidateRepository}
 */
class CandidateRepository implements ICandidateRepository {
  private static instance: CandidateRepository;
  protected candidateModel: typeof CandidateModel;
  protected transaction?: Transaction;

  /**
   * Constructs WHERE clause for Sequelize queries based on filter criteria
   * @private
   * @param {ICandidateQuery} query - The query parameters
   * @returns {WhereOptions<CandidateModel>} Sequelize where options
   * @example
   * // Returns { [Op.or]: [{firstName: {[Op.iLike]: '%john%'}}, {lastName: {[Op.iLike]: '%john%'}}] }
   * buildWhereClause({ name: 'john' });
   */
  private readonly buildWhereClause = (
    query: ICandidateQuery,
  ): WhereOptions<CandidateModel> => {
    const where: WhereOptions<CandidateModel> = {};

    if (query.id) {
      where.id = { [Op.eq]: query.id };
    }

    if (query.userId) {
      where.userId = { [Op.eq]: query.userId };
    }

    if (query.firstName) {
      where.firstName = { [Op.iLike]: `%${query.firstName}%` };
    }

    if (query.lastName) {
      where.lastName = { [Op.iLike]: `%${query.lastName}%` };
    }

    if (query.title) {
      where.title = { [Op.eq]: `%${query.title}` };
    }

    if (query.skills) {
      where.skills = {
        [Op.overlap]: Array.isArray(query.skills)
          ? (query.skills as string[])
          : ([query.skills] as string[]),
      };
    }

    if (typeof query.isEmployed === 'boolean') {
      where.isEmployed = { [Op.eq]: query.isEmployed };
    }

    if (query.userId) {
      where.userId = { [Op.eq]: query.userId };
    }

    return where;
  };

  /**
   * Gets Sequelize options including transaction if available
   * @private
   * @returns {object} Sequelize options object
   */
  private getOptions() {
    return this.transaction ? { transaction: this.transaction } : {};
  }

  /**
   * Private constructor for singleton pattern
   * @private
   */
  private constructor() {
    this.candidateModel = CandidateModel;
  }

  /**
   * Creates a new repository instance bound to a transaction
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {CandidateRepository} New repository instance with transaction
   */
  public withTransaction(transaction: Transaction): CandidateRepository {
    const repository = new CandidateRepository();
    repository.candidateModel = this.candidateModel;
    repository.transaction = transaction;
    return repository;
  }

  /**
   * Gets singleton repository instance
   * @static
   * @returns {CandidateRepository} The repository instance
   */
  public static getInstance(): CandidateRepository {
    if (!CandidateRepository.instance) {
      CandidateRepository.instance = new CandidateRepository();
    }
    return CandidateRepository.instance;
  }

  /**
   * Creates a new candidate record
   * @param {ICandidate} candidate - Candidate data without id
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<ICandidate>} The created candidate DTO
   * @throws {RepositoryError} If creation fails
   * @example
   * await candidateRepository.create({ firstName: 'John', ... });
   */
  public async create(
    candidate: ICandidate,
    transaction?: Transaction,
  ): Promise<ICandidate> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const newCandidate = await this.candidateModel.create(candidate, {
        ...this.getOptions(),
        transaction: t,
      });

      if (isLocalTransaction) {
        await t.commit();
      }

      return toICandidateDTO(newCandidate);
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to create candidate', error);
    }
  }

  /**
   * Retrieves a single candidate by query criteria
   * @param {ICandidateQuery} query - Search criteria
   * @returns {Promise<ICandidate | null>} Candidate DTO if found, null otherwise
   * @throws {RepositoryError} If query fails
   * @example
   * // Find by skills
   * await candidateRepository.read({ skills: ['JavaScript'] });
   */
  public async read(query: ICandidateQuery): Promise<ICandidate | null> {
    try {
      const candidate = await this.candidateModel.findOne({
        where: this.buildWhereClause(query),
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: {
              exclude: ['password'],
            },
          },
        ],
        ...this.getOptions(),
      });
      return candidate ? toICandidateDTO(candidate) : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve candidate', error);
    }
  }

  /**
   * Retrieves paginated list of candidates matching query criteria
   * @param {ICandidateQuery} query - Filter criteria
   * @param {IPaginationQueryOptions} options - Pagination configuration
   * @returns {Promise<PaginatedCandidateResponse>} Paginated candidate results
   * @throws {RepositoryError} If query fails
   * @example
   * // Get first page of employed candidates
   * await candidateRepository.readAll(
   *   { isEmployed: true },
   *   { page: 1, limit: 10 }
   * );
   */
  public async readAll(
    query: ICandidateQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    candidates: ICandidate[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);

    try {
      const { rows, count } = await this.candidateModel.findAndCountAll({
        where: this.buildWhereClause(query),
        include: [
          {
            model: UserModel,
            as: 'user',
            attributes: {
              exclude: ['password'],
            },
          },
        ],
        offset: pagination.getOffset(),
        limit: pagination.limit,
        order: pagination.getOrder(),
        ...this.getOptions(),
      });

      return {
        candidates: rows.map(toICandidateDTO),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve candidates', error);
    }
  }

  /**
   * Updates a candidate by ID
   * @param {string} id - Candidate ID to update
   * @param {Partial<ICandidate>} data - Data to update
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<ICandidate | null>} Updated candidate DTO if found, null otherwise
   * @throws {RepositoryError} If update fails
   */
  public async update(
    id: string,
    data: Partial<ICandidate>,
    transaction?: Transaction,
  ): Promise<ICandidate | null> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const [affectedRows] = await this.candidateModel.update(data, {
        where: { id },
        transaction: t,
        individualHooks: true,
      });

      if (affectedRows > 0) {
        const updatedCandidate = await this.read({ id });
        if (isLocalTransaction) {
          await t.commit();
        }
        return updatedCandidate;
      }

      if (isLocalTransaction) {
        await t.rollback();
      }
      return null;
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to update candidate', error);
    }
  }

  /**
   * Deletes a candidate by ID
   * @param {string} id - Candidate ID to delete
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
   * @throws {RepositoryError} If deletion fails
   */
  public async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const deletedRows = await this.candidateModel.destroy({
        where: { id },
        transaction: t,
      });

      if (isLocalTransaction) {
        await t.commit();
      }

      return deletedRows > 0;
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to delete candidate', error);
    }
  }
}

export const candidateRepository = CandidateRepository.getInstance();
