import { Op, WhereOptions, Transaction } from 'sequelize';
import { AdminModel } from '@work-whiz/models/admin.model';
import {
  IAdmin,
  IAdminQuery,
  IAdminRepository,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { toIAdminDTO } from '@work-whiz/dtos';
import { RepositoryError } from '@work-whiz/errors';
import { Pagination } from '@work-whiz/utils';
import { sequelize } from '@work-whiz/libs';
import { UserModel } from '@work-whiz/models';

/**
 * Repository for handling database operations for Admin entities
 * @class AdminRepository
 * @implements {IAdminRepository}
 */
class AdminRepository implements IAdminRepository {
  private static instance: AdminRepository;
  protected adminModel: typeof AdminModel;
  protected transaction?: Transaction;

  /**
   * Builds Sequelize where clause from query object
   * @private
   * @param {IAdminQuery} query - The query parameters
   * @returns {WhereOptions<AdminModel>} Sequelize where options
   */
  private readonly buildWhereClause = (
    query: IAdminQuery,
  ): WhereOptions<AdminModel> => {
    const where: WhereOptions<AdminModel> = {};

    if (query.id) {
      where.id = { [Op.eq]: query.id };
    }

    if (query.firstName) {
      where.firstName = { [Op.iLike]: `%${query.firstName}%` };
    }

    if (query.lastName) {
      where.lastName = { [Op.iLike]: `%${query.lastName}%` };
    }

    if (query.permissions) {
      where.permissions = {
        [Op.overlap]: Array.isArray(query.permissions)
          ? query.permissions
          : [query.permissions],
      };
    }

    if (query.userId) {
      where.userId = { [Op.eq]: query.userId };
    }

    return where;
  };

  /**
   * Gets options object including transaction if available
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
    this.adminModel = AdminModel;
  }

  /**
   * Creates a new repository instance bound to a transaction
   * @param {Transaction} transaction - Sequelize transaction
   * @returns {AdminRepository} New repository instance with transaction
   */
  public withTransaction(transaction: Transaction): AdminRepository {
    const repository = new AdminRepository();
    repository.adminModel = this.adminModel;
    repository.transaction = transaction;
    return repository;
  }

  /**
   * Gets singleton repository instance
   * @static
   * @returns {AdminRepository} The repository instance
   */
  public static getInstance(): AdminRepository {
    if (!AdminRepository.instance) {
      AdminRepository.instance = new AdminRepository();
    }
    return AdminRepository.instance;
  }

  /**
   * Creates a new admin record
   * @param {Omit<IAdmin, 'id'>} admin - Admin data without id
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IAdmin>} The created admin DTO
   * @throws {RepositoryError} If creation fails
   */
  public async create(
    admin: Omit<IAdmin, 'id'>,
    transaction?: Transaction,
  ): Promise<IAdmin> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;

    try {
      const newAdmin = await this.adminModel.create(admin, {
        ...this.getOptions(),
        transaction: t,
      });

      if (isLocalTransaction) {
        await t.commit();
      }

      return toIAdminDTO(newAdmin);
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to create admin record', error);
    }
  }

  /**
   * Retrieves a single admin record matching the query
   * @param {IAdminQuery} query - Search criteria
   * @returns {Promise<IAdmin | null>} Admin DTO if found, null otherwise
   * @throws {RepositoryError} If query fails
   */
  public async read(query: IAdminQuery): Promise<IAdmin | null> {
    try {
      const admin = await this.adminModel.scope('withUser').findOne({
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
      return admin ? toIAdminDTO(admin) : null;
    } catch (error) {
      throw new RepositoryError('Failed to retrieve admin record', error);
    }
  }

  /**
   * Retrieves paginated admin records matching the query
   * @param {IAdminQuery} query - Search criteria
   * @param {IPaginationQueryOptions} options - Pagination configuration
   * @returns {Promise<{ admins: IAdmin[]; total: number; totalPages: number }>} Paginated results
   * @throws {RepositoryError} If query fails
   */
  public async readAll(
    query: IAdminQuery,
    options: IPaginationQueryOptions,
  ): Promise<{
    admins: IAdmin[];
    total: number;
    totalPages: number;
    currentPage: number;
    perPage: number;
  }> {
    const pagination = new Pagination(options);
    try {
      const { rows, count } = await this.adminModel.findAndCountAll({
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
        order: pagination.getOrder() ?? [['createdAt', 'ASC']],
        ...this.getOptions(),
      });

      return {
        admins: rows.map(toIAdminDTO),
        total: count,
        totalPages: pagination.getTotalPages(count),
        currentPage: pagination.page,
        perPage: pagination.limit,
      };
    } catch (error) {
      throw new RepositoryError('Failed to retrieve admin records', error);
    }
  }

  /**
   * Updates an admin record by ID
   * @param {string} id - Admin ID
   * @param {Partial<IAdmin>} data - Data to update
   * @param {Transaction} [transaction] - Optional transaction
   * @returns {Promise<IAdmin | null>} Updated admin DTO if found, null otherwise
   * @throws {RepositoryError} If update fails
   */
  public async update(
    id: string,
    data: Partial<IAdmin>,
    transaction?: Transaction,
  ): Promise<IAdmin | null> {
    const t = transaction || (await sequelize.transaction());
    const isLocalTransaction = !transaction;
    try {
      const [affectedRows] = await this.adminModel.update(data, {
        where: { id },
        ...this.getOptions(),
        transaction: t,
      });

      if (affectedRows > 0) {
        const updatedAdmin = await this.read({ id });
        if (isLocalTransaction) {
          await t.commit();
        }
        return toIAdminDTO(updatedAdmin);
      }

      if (isLocalTransaction) {
        await t.rollback();
      }

      return null;
    } catch (error) {
      if (isLocalTransaction) {
        await t.rollback();
      }
      throw new RepositoryError('Failed to update admin record', error);
    }
  }
}

export const adminRepository = AdminRepository.getInstance();
