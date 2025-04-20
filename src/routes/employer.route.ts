import { Router } from 'express';
import { employerController, userController } from '@work-whiz/controllers';
import {
  profileLimiter,
  authenticationMiddleware,
} from '@work-whiz/middlewares';

export class EmployerRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
    return (
      this.router

        /**
         * @swagger
         * tags:
         *   name: Employers
         *   description: Employer management endpoints
         */

        /**
         * @swagger
         * /employers/me:
         *   get:
         *     summary: Get current employer
         *     tags: [Employers]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Employer data
         *       401:
         *         description: Unauthorized
         */
        .get(
          '/me',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          employerController.getEmployer,
        )

        /**
         * @swagger
         * /employers/me:
         *   patch:
         *     summary: Update employer profile
         *     tags: [Employers]
         *     security:
         *       - bearerAuth: []
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/EmployerUpdate'
         *     responses:
         *       200:
         *         description: Employer updated
         *       400:
         *         description: Validation error
         *       401:
         *         description: Unauthorized
         */
        .patch(
          '/me',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          employerController.updateEmployer,
        )

        /**
         * @swagger
         * /employers:
         *   get:
         *     summary: Get all employers
         *     tags: [Employers]
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *         description: Page number
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *         description: Page size
         *       - in: query
         *         name: sort
         *         schema:
         *           type: string
         *         description: Sort fields (e.g. name:asc,createdAt:desc)
         *     responses:
         *       200:
         *         description: Paginated list of employers
         */
        .get(
          '/',
          profileLimiter,
          employerController.getEmployers,
        )

        /**
         * @swagger
         * /employers/me/contact:
         *   patch:
         *     summary: Update employer contact details
         *     tags: [Employers]
         *     security:
         *       - bearerAuth: []
         *     responses:
         *       200:
         *         description: Contact updated
         *       401:
         *         description: Unauthorized
         */
        .patch(
          '/me/contact',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          userController.updateContact,
        )
    );
  }
}
