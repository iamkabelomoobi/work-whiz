import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ParsedQs } from 'qs';
import { responseUtil } from '@work-whiz/utils';
import { jobService } from '@work-whiz/services';
import {
  IJob,
  IJobQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { validateJob } from '@work-whiz/validators';

/**
 * Controller for handling job-related HTTP requests
 */
class JobController {
  private static instance: JobController;

  /**
   * Extracts and formats query parameters from the request
   * @param {ParsedQs} query - The query parameters from the request
   * @returns {Object} An object containing job query and pagination options
   * @property {IJobQuery} jobQuery - The filtered job query parameters
   * @property {IPaginationQueryOptions} paginationOptions - Pagination and sorting options
   */
  private extractQueryParams(query: ParsedQs): {
    jobQuery: IJobQuery;
    paginationOptions: IPaginationQueryOptions;
  } {
    const { page = '1', limit = '10', sort, ...jobQuery } = query;

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
      jobQuery: jobQuery,
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
    // Private constructor for singleton pattern
  }

  /**
   * Gets the singleton instance of JobController
   * @returns {JobController} The singleton instance
   */
  public static getInstance(): JobController {
    if (!JobController.instance) {
      JobController.instance = new JobController();
    }
    return JobController.instance;
  }

  /**
   * Creates a new job
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public createJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals.userId as string;

      const data = req.body as Omit<IJob, 'id'>;
      const validationError = validateJob(data);
      if (validationError) {
        responseUtil.sendError(res, {
          message: validationError?.details[0].message,
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const payload = await jobService.createJob(userId, data);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.CREATED,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Retrieves a single job by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public readJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        responseUtil.sendError(res, {
          message: 'Job ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }
      const job = await jobService.findJob(jobId);

      responseUtil.sendSuccess(res, {
        payload: job,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Retrieves multiple jobs with optional filtering and pagination
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public readAllJobs = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paginationOptions, jobQuery } = this.extractQueryParams(
        req.query,
      );

      const payload = await jobService.findJobs(jobQuery, paginationOptions);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Updates an existing job
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public updateJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      const data = req.body as Omit<IJob, 'id'>;
      if (!jobId) {
        responseUtil.sendError(res, {
          message: 'Job ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const validationError = validateJob(data, true);
      if (validationError) {
        responseUtil.sendError(res, {
          message: validationError?.details[0].message,
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const payload = await jobService.updateJob(jobId, data);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };

  /**
   * Deletes a job by ID
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   * @returns {Promise<void>}
   */
  public deleteJob = async (req: Request, res: Response): Promise<void> => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        responseUtil.sendError(res, {
          message: 'Job ID is required',
          statusCode: StatusCodes.BAD_REQUEST,
        });
        return;
      }

      const payload = await jobService.deleteJob(jobId);
      responseUtil.sendSuccess(res, {
        payload,
        statusCode: StatusCodes.OK,
      });
    } catch (error: unknown) {
      this.handleError(res, error);
    }
  };
}

export const jobController = JobController.getInstance();
