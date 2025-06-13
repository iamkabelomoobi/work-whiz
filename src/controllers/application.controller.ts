import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ParsedQs } from 'qs';
import { responseUtil } from '@work-whiz/utils';
import { applicationService } from '@work-whiz/services';
import {
  IApplication,
  IApplicationQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

/**
 * Controller for handling application-related HTTP requests
 */
class ApplicationController {
  private static instance: ApplicationController;

  /**
   * Extracts and formats query parameters from the request
   * @param {ParsedQs} query - The query parameters from the request
   * @returns {Object} An object containing application query and pagination options
   */
  private extractQueryParams(query: ParsedQs): {
    applicationQuery: IApplicationQuery;
    paginationOptions: IPaginationQueryOptions;
  } {
    const { page = '1', limit = '10', sort, ...applicationQuery } = query;

    let sortOptions: Record<string, 'ASC' | 'DESC'> | undefined;
    if (typeof sort === 'string') {
      sortOptions = {};
      for (const field of sort.split(',')) {
        const [fieldName, direction] = field.split(':');
        if (fieldName && direction) {
          sortOptions[fieldName.trim()] =
            direction.trim().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        }
      }
    }

    return {
      paginationOptions: {
        page: parseInt(page as string, 10) || 1,
        limit: parseInt(limit as string, 10) || 10,
        sort: sortOptions,
      },
      applicationQuery: applicationQuery as IApplicationQuery,
    };
  }

  /**
   * Handles errors and sends appropriate HTTP responses
   * @param {Response} res - Express response object
   * @param {unknown} error - The error that occurred
   */
  private handleError = (res: Response, error: unknown): void => {
    const statusCode =
      (error as { statusCode?: number })?.statusCode ||
      StatusCodes.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'Internal Server Error';

    responseUtil.sendError(res, { message, statusCode });
  };

  private constructor() {
    //
  }

  /**
   * Gets the singleton instance of ApplicationController
   * @returns {ApplicationController} The singleton instance
   */
  public static getInstance(): ApplicationController {
    if (!ApplicationController.instance) {
      ApplicationController.instance = new ApplicationController();
    }
    return ApplicationController.instance;
  }

  /**
   * Creates a new application
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public createApplication = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = req.app.locals.userId as string;
      const data = req.body as Omit<IApplication, 'id'>;

      // Optionally, add validation here

      const payload = await applicationService.createApplication(userId, data);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.CREATED,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Retrieves a single application by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public readApplication = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      if (!applicationId) {
        responseUtil.sendError(res, {
          message: 'Application ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }
      const application = await applicationService.findApplication(
        applicationId,
      );

      responseUtil.sendSuccess(res, {
        payload: application,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Retrieves multiple applications with optional filtering and pagination
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public readAllApplications = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { paginationOptions, applicationQuery } = this.extractQueryParams(
        req.query,
      );

      const payload = await applicationService.findApplications(
        applicationQuery,
        paginationOptions,
      );
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Updates an existing application
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public updateApplication = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const data = req.body as Partial<IApplication>;
      if (!applicationId) {
        responseUtil.sendError(res, {
          message: 'Application ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      // Optionally, add validation here

      const payload = await applicationService.updateApplication(
        applicationId,
        data,
      );
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Deletes an application by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public deleteApplication = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { applicationId } = req.params;
      if (!applicationId) {
        responseUtil.sendError(res, {
          message: 'Application ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const payload = await applicationService.deleteApplication(applicationId);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };
}

export const applicationController = ApplicationController.getInstance();
