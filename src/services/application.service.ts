import { ServiceError } from '@work-whiz/errors';
import {
  IApplication,
  IApplicationQuery,
  IApplicationService,
  IPaginatedApplications,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import {
  applicationRepository,
  candidateRepository,
} from '@work-whiz/repositories';
import { StatusCodes } from 'http-status-codes';
import { cacheUtil } from '@work-whiz/utils';
import { BaseService } from './base.service';
import { applicationQueue } from '@work-whiz/queues';

class ApplicationService extends BaseService implements IApplicationService {
  private static instance: ApplicationService;

  private readonly CACHE_TTL = {
    SINGLE_APPLICATION: 3600,
    SEARCH_RESULTS: 300,
    EMPTY_RESULTS: 60,
  };

  private generateCacheKey = (applicationId: string): string => {
    return `application:${applicationId}`;
  };

  private generateSearchCacheKey = (
    query: IApplicationQuery,
    options: IPaginationQueryOptions,
  ): string => {
    const queryKey = JSON.stringify(query);
    return `applications:search:${queryKey}:page_${options.page}:limit_${options.limit}`;
  };

  private async invalidateSearchCaches(): Promise<void> {
    try {
      await cacheUtil.deletePattern('applications:search:*');
    } catch (error) {
      console.error('Error invalidating application search caches:', error);
    }
  }

  private async cacheSingleApplication(app: IApplication) {
    const cacheKey = this.generateCacheKey(app.id);
    await cacheUtil.set(cacheKey, app, this.CACHE_TTL.SINGLE_APPLICATION);
  }

  private constructor() {
    super();
  }

  public static getInstance(): ApplicationService {
    if (!ApplicationService.instance) {
      ApplicationService.instance = new ApplicationService();
    }
    return ApplicationService.instance;
  }

  public createApplication = async (
    userId: string,
    application: Omit<IApplication, 'id'>,
  ): Promise<{ message: string; application: IApplication }> =>
    this.handleErrors(async () => {
      const candidate = await candidateRepository.read({ userId });
      if (!candidate) {
        throw new ServiceError(StatusCodes.BAD_REQUEST, {
          message: 'Candidate not found.',
          trace: { method: this.createApplication.name, context: { userId } },
        });
      }

      // Attach candidateId to application
      const newApplication = await applicationRepository.create({
        ...application,
        candidateId: candidate.id,
      });

      if (!newApplication) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Application could not be created.',
          trace: {
            method: this.createApplication.name,
            context: { application },
          },
        });
      }

      await this.cacheSingleApplication(newApplication);

      await this.invalidateSearchCaches();

      const queuePayload = {
        id: newApplication.id,
        status: newApplication.status,
        jobTitle: newApplication.job?.title,
        candidate: {
          firstName: newApplication.candidate?.firstName,
          email: newApplication.candidate?.user?.email,
        },
      };
      await applicationQueue.add('application_created', queuePayload);

      return {
        message: 'Application created successfully.',
        application: newApplication,
      };
    }, this.createApplication.name);

  public findApplication = async (
    applicationId: string,
  ): Promise<IApplication> =>
    this.handleErrors(async () => {
      const cacheKey = this.generateCacheKey(applicationId);
      const cached = await cacheUtil.get(cacheKey);

      if (cached) {
        return cached as IApplication;
      }

      const application = await applicationRepository.read(applicationId);
      if (!application) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Application not found.',
          trace: {
            method: this.findApplication.name,
            context: { applicationId },
          },
        });
      }

      await this.cacheSingleApplication(application);
      return application;
    }, this.findApplication.name);

  public findApplications = async (
    query: IApplicationQuery,
    options: IPaginationQueryOptions,
  ): Promise<IPaginatedApplications> =>
    this.handleErrors(async () => {
      const searchCacheKey = this.generateSearchCacheKey(query, options);
      const cachedResults = await cacheUtil.get(searchCacheKey);

      if (cachedResults) {
        return cachedResults as IPaginatedApplications;
      }

      const payload = await applicationRepository.readAll(query, options);

      if (!payload.applications.length) {
        const emptyResults: IPaginatedApplications = {
          applications: [],
          total: 0,
          page: options.page || 1,
        };
        await cacheUtil.set(
          searchCacheKey,
          emptyResults,
          this.CACHE_TTL.EMPTY_RESULTS,
        );
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'No applications found.',
          trace: { method: this.findApplications.name, context: { query } },
        });
      }

      await cacheUtil.set(
        searchCacheKey,
        payload,
        this.CACHE_TTL.SEARCH_RESULTS,
      );

      await Promise.all(
        payload.applications.map(app => this.cacheSingleApplication(app)),
      );

      return payload;
    }, this.findApplications.name);

  public updateApplication = async (
    applicationId: string,
    data: Partial<IApplication>,
  ): Promise<{ message: string; application: IApplication }> =>
    this.handleErrors(async () => {
      const application = await applicationRepository.read(applicationId);
      if (!application) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Application not found.',
          trace: {
            method: this.updateApplication.name,
            context: { applicationId },
          },
        });
      }

      const updatedApplication = await applicationRepository.update(
        applicationId,
        data,
      );
      if (!updatedApplication) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Application could not be updated.',
          trace: {
            method: this.updateApplication.name,
            context: { applicationId },
          },
        });
      }

      await this.cacheSingleApplication(updatedApplication);

      await this.invalidateSearchCaches();

      const queuePayload = {
        id: updatedApplication.id,
        status: updatedApplication.status,
        jobTitle: updatedApplication.job?.title,
        candidate: {
          firstName: updatedApplication.candidate?.firstName,
          email: updatedApplication.candidate?.user?.email,
        },
      };
      await applicationQueue.add(
        `application_${updatedApplication.status}`,
        queuePayload,
      );

      return {
        message: 'Application updated successfully.',
        application: updatedApplication,
      };
    }, this.updateApplication.name);

  public deleteApplication = async (
    applicationId: string,
  ): Promise<{ message: string }> =>
    this.handleErrors(async () => {
      const application = await applicationRepository.read(applicationId);
      if (!application) {
        throw new ServiceError(StatusCodes.NOT_FOUND, {
          message: 'Application not found.',
          trace: {
            method: this.deleteApplication.name,
            context: { applicationId },
          },
        });
      }

      const result = await applicationRepository.delete(applicationId);
      if (!result) {
        throw new ServiceError(StatusCodes.INTERNAL_SERVER_ERROR, {
          message: 'Application could not be deleted.',
          trace: {
            method: this.deleteApplication.name,
            context: { applicationId },
          },
        });
      }

      const cacheKey = this.generateCacheKey(applicationId);
      await cacheUtil.delete(cacheKey);

      await this.invalidateSearchCaches();

      return { message: 'Application deleted successfully.' };
    }, this.deleteApplication.name);
}

export const applicationService = ApplicationService.getInstance();
