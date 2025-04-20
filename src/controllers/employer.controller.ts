import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ParsedQs } from 'qs';
import { responseUtil } from '@work-whiz/utils';
import { employerService } from '@work-whiz/services';
import {
  IEmployer,
  IEmployerQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';
import { employerValidator } from '@work-whiz/validators';

interface AppError extends Error {
  statusCode?: number;
}

class EmployerController {
  private static instance: EmployerController;

  private constructor() {
    //
  }

  public static getInstance(): EmployerController {
    if (!EmployerController.instance) {
      EmployerController.instance = new EmployerController();
    }
    return EmployerController.instance;
  }

  private extractQueryParams(query: ParsedQs): {
    paginationOptions: IPaginationQueryOptions;
    employerQuery: IEmployerQuery;
  } {
    const { page = '1', limit = '10', sort, ...employerQuery } = query;

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
      employerQuery: employerQuery as IEmployerQuery,
    };
  }

  private handleError = (res: Response, error: unknown): void => {
    const statusCode =
      (error as AppError).statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
    const message =
      error instanceof Error ? error.message : 'An unknown error occurred';

    responseUtil.sendError(res, {
      message,
      statusCode,
    });
  };

  public getEmployer = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals.userId;
      const response = await employerService.findOne({ userId });

      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getEmployers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paginationOptions, employerQuery } = this.extractQueryParams(
        req.query,
      );

      const response = await employerService.findAll(
        employerQuery,
        paginationOptions,
      );

      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public updateEmployer = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = req.app.locals.userId;
      const data = req.body as Partial<IEmployer>;

      const validDataError = employerValidator(data);
      if (validDataError) {
        return responseUtil.sendError(res, {
          message: validDataError.details[0].message,
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const response = await employerService.update(userId, data);

      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.handleError(res, error);
    }
  };
}

export const employerController = EmployerController.getInstance();
