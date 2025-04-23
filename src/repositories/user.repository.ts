import { Op, WhereOptions, Transaction } from 'sequelize';
import { sequelize } from '@work-whiz/libs';
import { UserModel } from '@work-whiz/models';
import { toIUserDTO } from '@work-whiz/dtos';
import {
  IUser,
  IUserQuery,
  IUserRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';

/**
 * Repository class for handling User entity database operations
 * @class UserRepository
 * @implements {IUserRepository}
 */
class UserRepository implements IUserRepository {
  private static instance: UserRepository;
  protected userModel: typeof UserModel;
  protected transaction?: Transaction;

  /**
   * Constructs WHERE clause for Sequelize queries based on filter criteria
   * @private
   * @param {IUserQuery} query - The query parameters
   * @returns {WhereOptions} Sequelize where options
   * @example
   * // Returns { id: { [Op.eq]: '123' } }
   * buildWhereClause({ id: '123' });
   */
  private readonly buildWhereClause = (query: IUserQuery): WhereOptions => {
    const where: WhereOptions = {};

    if (query.id) {
      where.id = { [Op.eq]: query.id };
    }

    if (query.email) {
      where.email = {
        [Op.eq]: query.email.toLowerCase(),
      };
    }

    if (query.phone) {
      where.phone = {
        [Op.eq]: query.phone,
      };
    }

    if (query.role) {
      where.role = { [Op.eq]: query.role };
    }

    if (typeof query.isActive === 'boolean') {
      where.isActive = { [Op.eq]: query.isActive };
    }

    if (typeof query.isVerified === 'boolean') {
      where.isVerified = { [Op.eq]: query.isVerified };
    }

    if (typeof query.isLocked === 'boolean') {
      where.isLocked = { [Op.eq]: query.isLocked };
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
    this.userModel = UserModel;
  }

  /**
   * Creates a new repository instance bound to a transaction
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {UserRepository} New repository instance with transaction
   */
  public withTransaction(transaction: Transaction): UserRepository {
    const repository = new UserRepository();
    repository.userModel = this.userModel;
    repository.transaction = transaction;
    return repository;
  }

  /**
   * Gets singleton repository instance
   * @static
   * @returns {UserRepository} The repository instance
   */
  public static getInstance(): UserRepository {
    if (!UserRepository.instance) {
      UserRepository.instance = new UserRepository();
    }
    return UserRepository.instance;
  }

  /**
   * Creates a new user record
   * @param {Partial<IUser>} user - User data without id
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IUser>} The created user DTO
   * @throws {RepositoryError} If creation fails
   * @example
   * await userRepository.create({ email: 'test@example.com', ... });
   */
  public async create(
    user: Partial<IUser>,
    transaction?: Transaction,
  ): Promise<IUser> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const newUser = await this.userModel.create(user, {
        ...this.getOptions(),
        transaction: t,
      });

      if (isLocalTransaction) {
        await t.commit();
      }

      return toIUserDTO(newUser);
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to create user', error);
    }
  }

  /**
   * Retrieves a single user by query criteria
   * @param {IUserQuery} query - Search criteria
   * @returns {Promise<IUser>} User DTO if found, null otherwise
   * @throws {RepositoryError} If query fails
   * @example
   * // Find by email
   * await userRepository.read({ email: 'test@example.com' });
   */
  public async read(query: IUserQuery): Promise<IUser | null> {
    try {
      const user = await this.userModel.findOne({
        where: this.buildWhereClause(query),
        ...this.getOptions(),
      });

      return user ? toIUserDTO(user) : null;
    } catch (error) {
      console.error(error);
      throw new RepositoryError('Failed to retrieve user', error);
    }
  }

  /**
   * Retrieves paginated list of users matching query criteria
   * @param {IUserQuery} query - Filter criteria
   * @param {IPaginationQueryOptions} options - Pagination configuration
   * @returns {Promise<PaginatedResponse<IUser>>} Paginated user results
   * @throws {RepositoryError} If query fails
   * @example
   * // Get first page of active users
   * await userRepository.readAll(
   *   { isActive: true },
   *   { page: 1, limit: 10 }
   * );
   */
  public async readAll(
    query: IUserQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    users: IUser[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);

    try {
      const { rows, count } = await this.userModel.findAndCountAll({
        where: this.buildWhereClause(query),
        offset: pagination.getOffset(),
        limit: pagination.limit,
        order: pagination.getOrder(),
        ...this.getOptions(),
      });

      return {
        users: rows.map(user =>
          toIUserDTO({
            ...user.get({ plain: true }),
            avatarUrl: user.avatarUrl || '',
          }),
        ),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve users', error);
    }
  }

  /**
   * Updates a user by ID
   * @param {string} id - User ID to update
   * @param {Partial<IUser>} data - Data to update
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IUser>} Updated user DTO if found, null otherwise
   * @throws {RepositoryError} If update fails
   */
  public async update(
    id: string,
    data: Partial<IUser>,
    transaction?: Transaction,
  ): Promise<IUser> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const [affectedRows] = await this.userModel.update(data, {
        where: { id },
        transaction: t,
      });

      if (affectedRows > 0) {
        const updatedUser = await this.read({ id });
        if (isLocalTransaction) {
          await t.commit();
        }
        return toIUserDTO(updatedUser);
      }

      if (isLocalTransaction) {
        await t.rollback();
      }
      return null;
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to update user', error);
    }
  }

  /**
   * Deletes a user by ID
   * @param {string} id - User ID to delete
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<boolean>} True if deletion succeeded, false otherwise
   * @throws {RepositoryError} If deletion fails
   */
  public async delete(id: string, transaction?: Transaction): Promise<boolean> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const deletedRows = await this.userModel.destroy({
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
      throw new RepositoryError('Failed to delete user', error);
    }
  }
}

export const userRepository = UserRepository.getInstance();
