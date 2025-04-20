import { Op, WhereOptions, Transaction } from 'sequelize';
import { EmployerModel, UserModel } from '@work-whiz/models';
import {
  IEmployer,
  IEmployerQuery,
  IEmployerRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { sequelize } from '@work-whiz/libs';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { toIEmployerDTO } from '@work-whiz/dtos';

/**
 * Repository class for handling Employer entity database operations
 * @class EmployerRepository
 * @implements {IEmployerRepository}
 */
class EmployerRepository implements IEmployerRepository {
  private static instance: EmployerRepository;
  protected employerModel: typeof EmployerModel;
  protected transaction?: Transaction;

  /**
   * Constructs WHERE clause for Sequelize queries based on filter criteria
   * @private
   * @param {IEmployerQuery} query - The query parameters
   * @returns {WhereOptions<EmployerModel>} Sequelize where options
   * @example
   * // Returns { name: { [Op.iLike]: '%tech%' } }
   * buildWhereClause({ name: 'tech' });
   */
  private readonly buildWhereClause = (
    query: IEmployerQuery,
  ): WhereOptions<EmployerModel> => {
    const where: WhereOptions<EmployerModel> = {};

    if (query.id) {
      where.id = { [Op.eq]: query.id };
    }

    if (query.name) {
      where.name = { [Op.iLike]: `%${query.name}%` };
    }

    if (query.industry) {
      where.industry = { [Op.iLike]: `%${query.industry}%` };
    }

    if (query.location) {
      where.location = { [Op.iLike]: `%${query.location}%` };
    }

    if (typeof query.isVerified === 'boolean') {
      where.isVerified = { [Op.eq]: query.isVerified };
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
    this.employerModel = EmployerModel;
  }

  /**
   * Creates a new repository instance bound to a transaction
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {EmployerRepository} New repository instance with transaction
   */
  public withTransaction(transaction: Transaction): EmployerRepository {
    const repository = new EmployerRepository();
    repository.employerModel = this.employerModel;
    repository.transaction = transaction;
    return repository;
  }

  /**
   * Gets singleton repository instance
   * @static
   * @returns {EmployerRepository} The repository instance
   */
  public static getInstance(): EmployerRepository {
    if (!EmployerRepository.instance) {
      EmployerRepository.instance = new EmployerRepository();
    }
    return EmployerRepository.instance;
  }

  /**
   * Creates a new employer record
   * @param {Omit<IEmployer, 'id'>} employer - Employer data without id
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IEmployer>} The created employer DTO
   * @throws {RepositoryError} If creation fails
   * @example
   * await employerRepository.create({ name: 'Tech Corp', ... });
   */
  public async create(
    employer: Omit<IEmployer, 'id'>,
    transaction?: Transaction,
  ): Promise<IEmployer> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const newEmployer = await this.employerModel.create(employer, {
        ...this.getOptions(),
        transaction: t,
      });

      if (isLocalTransaction) {
        await t.commit();
      }

      return toIEmployerDTO(newEmployer);
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to create employer', error);
    }
  }

  /**
   * Retrieves a single employer by query criteria
   * @param {IEmployerQuery} query - Search criteria
   * @returns {Promise<IEmployer | null>} Employer DTO if found, null otherwise
   * @throws {RepositoryError} If query fails
   * @example
   * // Find by name
   * await employerRepository.read({ name: 'Tech Corp' });
   */
  public async read(query: IEmployerQuery): Promise<IEmployer | null> {
    try {
      const employer = await this.employerModel.findOne({
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
      return employer ? toIEmployerDTO(employer) : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve employer', error);
    }
  }

  /**
   * Retrieves paginated list of employers matching query criteria
   * @param {IEmployerQuery} query - Filter criteria
   * @param {IPaginationQueryOptions} options - Pagination configuration
   * @returns {Promise<PaginatedEmployerResponse>} Paginated employer results
   * @throws {RepositoryError} If query fails
   * @example
   * // Get first page of verified employers
   * await employerRepository.readAll(
   *   { isVerified: true },
   *   { page: 1, limit: 10 }
   * );
   */
  public async readAll(
    query: IEmployerQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    employers: IEmployer[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);

    try {
      const { rows, count } = await this.employerModel.findAndCountAll({
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
        employers: rows.map(toIEmployerDTO),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve employers', error);
    }
  }

  /**
   * Updates an employer by ID
   * @param {string} id - Employer ID to update
   * @param {Partial<IEmployer>} data - Data to update
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IEmployer | null>} Updated employer DTO if found, null otherwise
   * @throws {RepositoryError} If update fails
   */
  public async update(
    id: string,
    data: Partial<IEmployer>,
    transaction?: Transaction,
  ): Promise<IEmployer | null> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const [affectedRows] = await this.employerModel.update(data, {
        where: { userId: id },
        transaction: t,
        individualHooks: true,
      });

      if (affectedRows > 0) {
        const updatedEmployer = await this.read({ id });
        if (isLocalTransaction) {
          await t.commit();
        }
        return updatedEmployer;
      }

      if (isLocalTransaction) {
        await t.rollback();
      }
      return null;
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to update employer', error);
    }
  }

  /**
   * Deletes an employer by ID
   * @param {string} id - Employer ID to delete
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
   * @throws {RepositoryError} If deletion fails
   */
  public async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const deletedRows = await this.employerModel.destroy({
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
      throw new RepositoryError('Failed to delete employer', error);
    }
  }
}

export const employerRepository = EmployerRepository.getInstance();
