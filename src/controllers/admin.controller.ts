import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { responseUtil } from '@work-whiz/utils';
import { adminService } from '@work-whiz/services';
import { adminValidator } from '@work-whiz/validators';
import {
  IAdmin,
  IAdminQuery,
  IPaginationQueryOptions,
} from '@work-whiz/interfaces';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints related to admin profiles
 */
class AdminController {
  private static instance: AdminController;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): AdminController {
    if (!AdminController.instance) {
      AdminController.instance = new AdminController();
    }
    return AdminController.instance;
  }

  /**
   * Helper method to extract and separate query parameters
   */
  private extractQueryParams(query: ParsedQs): {
    paginationOptions: IPaginationQueryOptions;
    adminQuery: IAdminQuery;
  } {
    const { page = '1', limit = '10', sort, ...adminQuery } = query;

    // Parse sort parameter
    let sortOptions: Record<string, 'ASC' | 'DESC'> | undefined;
    if (typeof sort === 'string') {
      sortOptions = {};
      const sortFields = sort.split(',');

      for (const field of sortFields) {
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
      adminQuery: adminQuery as IAdminQuery,
    };
  }

  /**
   * Unified error handler for all controller methods
   */
  private handleError(res: Response, error: unknown): void {
    if (error instanceof Error) {
      responseUtil.sendError(res, {
        message: error.message,
        statusCode:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
      });
    } else {
      responseUtil.sendError(res, {
        message: 'An unknown error occurred',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      });
    }
  }

  /**
   * Validates admin data and sends error response if invalid
   */
  private validateAdminData(res: Response, data: Partial<IAdmin>): boolean {
    const validDataError = adminValidator(data);
    if (validDataError) {
      responseUtil.sendError(res, {
        message: validDataError.details[0].message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
      return false;
    }
    return true;
  }

  /**
   * @swagger
   * /api/admins/{id}:
   *   get:
   *     summary: Get admin by ID
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Admin details
   *       404:
   *         description: Admin not found
   */
  public getAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals?.userId;

      console.log(userId);

      const response = await adminService.findOne({ userId });
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      console.error(error);
      this.handleError(res, error);
    }
  };

  /**
   * @swagger
   * /api/admins:
   *   get:
   *     summary: Get all admins
   *     tags: [Admin]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: List of admins
   */
  public getAllAdmins = async (req: Request, res: Response): Promise<void> => {
    try {
      const { paginationOptions, adminQuery } = this.extractQueryParams(
        req.query,
      );

      const response = await adminService.findAll(
        adminQuery,
        paginationOptions,
      );
      responseUtil.sendSuccess(res, response, String());
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @swagger
   * /api/admins/{id}:
   *   patch:
   *     summary: Update admin details
   *     tags: [Admin]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Admin'
   *     responses:
   *       200:
   *         description: Admin updated successfully
   *       400:
   *         description: Invalid input data
   */
  public updateAdmin = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals?.userId;

      const data = req.body as Partial<IAdmin>;
      if (!this.validateAdminData(res, data)) {
        return;
      }

      const response = await adminService.update(userId, data);
      responseUtil.sendSuccess(res, response, String());
    } catch (error) {
      this.handleError(res, error);
    }
  };
}

export const adminController = AdminController.getInstance();
