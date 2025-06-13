import { Op, WhereOptions, Transaction } from 'sequelize';

import { sequelize } from '@work-whiz/libs';
import { toApplicationDTO } from '@work-whiz/dtos';
import { RepositoryError } from '@work-whiz/errors';
import { ApplicationModel, CandidateModel, JobModel } from '@work-whiz/models';
import {
  IApplication,
  IApplicationQuery,
  IPaginatedApplications,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { IApplicationRepository } from '@work-whiz/interfaces/repositories';
import { Pagination } from '@work-whiz/utils';

class ApplicationRepository implements IApplicationRepository {
  private static instance: ApplicationRepository;
  protected applicationModel: typeof ApplicationModel;
  private transaction: Transaction | null = null;

  private buildWhereClause = (query: IApplicationQuery): WhereOptions => {
    const where: WhereOptions = {};

    if (query.id) {
      where.id = { [Op.eq]: query.id };
    }
    if (query.jobId) {
      where.jobId = { [Op.eq]: query.jobId };
    }
    if (query.candidateId) {
      where.candidateId = { [Op.eq]: query.candidateId };
    }
    if (query.createdAt) {
      where.createdAt = { [Op.eq]: query.createdAt };
    }
    if (query.updatedAt) {
      where.updatedAt = { [Op.eq]: query.updatedAt };
    }

    return where;
  };

  private getOptions = () =>
    this.transaction ? { transaction: this.transaction } : {};

  private constructor() {
    this.applicationModel = ApplicationModel;
  }

  public static getInstance(): ApplicationRepository {
    if (!ApplicationRepository.instance) {
      ApplicationRepository.instance = new ApplicationRepository();
    }
    return ApplicationRepository.instance;
  }

  public withTransaction(transaction: Transaction): IApplicationRepository {
    const repository = new ApplicationRepository();
    repository.applicationModel = this.applicationModel;
    repository.transaction = transaction;
    return repository;
  }

  public async create(
    application: Omit<IApplication, 'id'>,
  ): Promise<IApplication> {
    try {
      const newApplication = await this.applicationModel.create(application, {
        ...this.getOptions(),
        include: [
          {
            model: JobModel,
            as: 'job',
            required: true,
            include: [
              {
                model: CandidateModel,
                as: 'candidate',
                required: true,
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      });

      return toApplicationDTO(newApplication.get({ plain: true }));
    } catch (error) {
      throw new RepositoryError('Failed to create application', error);
    }
  }

  public async read(applicationId: string): Promise<IApplication | null> {
    try {
      const application = await this.applicationModel.findOne({
        where: this.buildWhereClause({ id: applicationId }),
        ...this.getOptions(),
        include: [
          {
            model: JobModel,
            as: 'job',
            required: true,
            include: [
              {
                model: CandidateModel,
                as: 'candidate',
                required: true,
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      });

      return toApplicationDTO(
        application ? application.get({ plain: true }) : null,
      );
    } catch (error) {
      throw new RepositoryError('Failed to read application', error);
    }
  }

  public async readAll(
    query: IApplicationQuery,
    pagination: IPaginationQueryOptions,
  ): Promise<IPaginatedApplications> {
    const paginationObj = new Pagination(pagination);
    try {
      const { rows, count } = await this.applicationModel.findAndCountAll({
        where: this.buildWhereClause(query),
        distinct: true,
        col: 'id',
        limit: pagination.limit,
        ...this.getOptions(),
        include: [
          {
            model: JobModel,
            as: 'job',
            required: true,
            include: [
              {
                model: CandidateModel,
                as: 'candidate',
                required: true,
                attributes: ['id', 'firstName', 'lastName'],
              },
            ],
          },
        ],
      });

      const applications = rows.map(application =>
        toApplicationDTO(application.get({ plain: true })),
      );

      return {
        applications,
        total: count,
        page: paginationObj.page,
      };
    } catch (error) {
      throw new RepositoryError('Failed to read applications', error);
    }
  }

  public async update(
    applicationId: string,
    application: Partial<IApplication>,
  ): Promise<IApplication> {
    try {
      const [affectedRows, [updatedApplication]] =
        await this.applicationModel.update(application, {
          where: this.buildWhereClause({ id: applicationId }),
          returning: true,
          ...this.getOptions(),
        });

      if (affectedRows === 0 || !updatedApplication) {
        throw new RepositoryError('Application not found');
      }

      return toApplicationDTO(updatedApplication.get({ plain: true }));
    } catch (error) {
      throw new RepositoryError('Failed to update application', error);
    }
  }

  public async delete(applicationId: string): Promise<boolean> {
    try {
      const deletedRows = await this.applicationModel.destroy({
        where: this.buildWhereClause({ id: applicationId }),
        ...this.getOptions(),
      });

      return deletedRows > 0;
    } catch (error) {
      throw new RepositoryError('Failed to delete application', error);
    }
  }

  public async executeInTransaction<T>(
    work: (t: Transaction) => Promise<T>,
    existingTransaction?: Transaction,
  ): Promise<T> {
    if (existingTransaction) {
      return work(existingTransaction);
    }

    const transaction = await sequelize.transaction();
    try {
      const result = await work(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

export const applicationRepository = ApplicationRepository.getInstance();
