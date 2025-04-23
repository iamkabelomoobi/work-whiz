import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';
import { responseUtil } from '@work-whiz/utils';
import {
  emailValidator,
  passwordValidator,
  phoneValidator,
} from '@work-whiz/validators';
import { userService } from '@work-whiz/services';

interface IUpdateContactRequest {
  email: string;
  phone: string;
}

interface IUpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * @swagger
 * tags:
 *   name: User
 *   description: Endpoints related to user profiles
 */
class UserController {
  private static instance: UserController;

  private validateInput(
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validator: any,
    value: string,
  ): boolean {
    const error = validator(value);
    if (error) {
      responseUtil.sendError(res, {
        message: error.details[0].message,
        statusCode: StatusCodes.BAD_REQUEST,
      });
      return false;
    }
    return true;
  }

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

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  /**
   * @swagger
   * /users/contact:
   *   patch:
   *     summary: Update user contact information
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdateContactRequest'
   *     responses:
   *       200:
   *         description: Contact information updated
   *       400:
   *         description: Invalid input data
   */
  public updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, phone } = req.body as IUpdateContactRequest;
      const userId = req.app.locals?.userId;

      // Validate inputs
      if (email && !this.validateInput(res, emailValidator, email)) return;
      if (phone && !this.validateInput(res, phoneValidator, phone)) return;

      const response = await userService.updateContact(userId, {
        email,
        phone,
      });
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      console.log(error);
      this.handleError(res, error);
    }
  };

  /**
   * @swagger
   * /users/password:
   *   patch:
   *     summary: Update user password
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePasswordRequest'
   *     responses:
   *       200:
   *         description: Password updated
   *       400:
   *         description: Invalid input data
   */
  public updatePassword = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const { currentPassword, newPassword } =
        req.body as IUpdatePasswordRequest;
      const userId = req.app.locals?.userId;

      if (!this.validateInput(res, passwordValidator, newPassword)) {
        return;
      }

      const response = await userService.updatePassword(userId, {
        currentPassword,
        newPassword,
      });
      responseUtil.sendSuccess(res, response, String(StatusCodes.OK));
    } catch (error) {
      this.handleError(res, error);
    }
  };

  /**
   * @swagger
   * /users/account:
   *   delete:
   *     summary: Delete user account
   *     responses:
   *       200:
   *         description: Account deleted
   *       401:
   *         description: Unauthorized
   */
  public deleteAccount = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.app.locals?.userId;

      await userService.deleteAccount(userId);
      responseUtil.sendSuccess(
        res,
        {
          message: 'Account deleted successfully',
        },
        String(StatusCodes.OK),
      );
    } catch (error) {
      this.handleError(res, error);
    }
  };
}

export const userController = UserController.getInstance();
