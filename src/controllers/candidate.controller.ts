import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { StatusCodes } from 'http-status-codes';
import { responseUtil } from '@work-whiz/utils';
import { candidateService } from '@work-whiz/services';
import { candidateValidator } from '@work-whiz/validators';
import {
  ICandidate,
  ICandidateQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

/**
 * Controller for handling candidate-related HTTP requests
 * @class
 */
class CandidateController {
  private static instance: CandidateController;

  /**
   * Extracts and separates query parameters into pagination and candidate query options
   * @private
   * @param {ParsedQs} query - The raw query parameters from the request
   * @returns {{
   *   paginationOptions: IPaginationQueryOptions,
   *   candidateQuery: ICandidateQuery
   * }} Separated and typed query parameters
   */
  private extractQueryParams(query: ParsedQs): {
    paginationOptions: IPaginationQueryOptions;
    candidateQuery: ICandidateQuery;
  } {
    const { page = '1', limit = '10', sort, ...candidateQuery } = query;
    const paginationOptions: IPaginationQueryOptions = {
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    if (typeof sort === 'string') {
      paginationOptions.sort = {};
      const sortFields = sort.split(',');

      for (const field of sortFields) {
        const [fieldName, direction] = field.split(':');
        if (fieldName && direction) {
          paginationOptions.sort[fieldName.trim()] =
            direction.trim().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        }
      }
    }

    return {
      paginationOptions,
      candidateQuery: candidateQuery as ICandidateQuery,
    };
  }

  /**
   * Handles errors consistently across all controller methods
   * @private
   * @param {Response} res - Express response object
   * @param {unknown} error - The caught error
   */
  private handleError(res: Response, error: unknown): void {
    if (error instanceof Error) {
      const statusCode =
        'statusCode' in error
          ? (error as { statusCode: number }).statusCode
          : StatusCodes.INTERNAL_SERVER_ERROR;

      responseUtil.sendError(res, {
        message: error.message,
        statusCode,
      });
    } else {
      responseUtil.sendError(res, {
        message: 'An unknown error occurred',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Validates candidate data using the candidate validator
   * @private
   * @param {Response} res - Express response object
   * @param {Partial<ICandidate>} data - Candidate data to validate
   * @returns {boolean} True if validation passes, false otherwise
   */
  private validateCandidateData(
    res: Response,
    data: Partial<ICandidate>,
  ): boolean {
    const validationError = candidateValidator(data);
    if (validationError) {
      responseUtil.sendError(res, {
        message:
          validationError.details[0]?.message || 'Invalid candidate data',
        statusCode: StatusCodes.BAD_REQUEST,
      });
      return false;
    }
    return true;
  }

  private constructor() {
    // Singleton pattern enforcement
  }

  /**
   * Gets the singleton instance of CandidateController
   * @static
   * @returns {CandidateController} The controller instance
   */
  public static getInstance(): CandidateController {
    if (!CandidateController.instance) {
      CandidateController.instance = new CandidateController();
    }
    return CandidateController.instance;
  }

  public getCandidate = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals.userId;
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await candidateService.findOne({ userId });
      responseUtil.sendSuccess(res, response, StatusCodes.OK.toString());
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public getCandidates = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paginationOptions, candidateQuery } = this.extractQueryParams(
        req.query,
      );

      const response = await candidateService.findAll(
        candidateQuery,
        paginationOptions,
      );

      responseUtil.sendSuccess(res, response, StatusCodes.OK.toString());
    } catch (error) {
      this.handleError(res, error);
    }
  };

  public updateCandidate = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = req.app.locals.userId;
      const data = req.body as Partial<ICandidate>;

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!this.validateCandidateData(res, data)) {
        return;
      }

      const response = await candidateService.update(userId, data);
      responseUtil.sendSuccess(res, response, StatusCodes.OK.toString());
    } catch (error) {
      this.handleError(res, error);
    }
  };
}

export const candidateController = CandidateController.getInstance();
