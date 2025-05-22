import { Router } from 'express';
import { applicationController } from '@work-whiz/controllers';
import { authorizationMiddleware } from '@work-whiz/middlewares';

/**
 * @swagger
 * tags:
 *   name: Applications
 *   description: Application management endpoints
 */
export class ApplicationRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
    return (
      this.router
        /**
         * @swagger
         * /api/applications:
         *   post:
         *     summary: Create a new application
         *     tags: [Applications]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/ApplicationInput'
         *     responses:
         *       201:
         *         description: Application created successfully
         *       400:
         *         description: Invalid input data
         *       500:
         *         description: Server error
         */
        .post(
          '',
          authorizationMiddleware.isAuthorized(['candidate']),
          applicationController.createApplication,
        )
        /**
         * @swagger
         * /api/applications/{applicationId}:
         *   get:
         *     summary: Get an application by ID
         *     tags: [Applications]
         *     parameters:
         *       - in: path
         *         name: applicationId
         *         schema:
         *           type: string
         *         required: true
         *         description: Application ID
         *     responses:
         *       200:
         *         description: Application data
         *       400:
         *         description: Invalid ID format
         *       404:
         *         description: Application not found
         *       500:
         *         description: Server error
         */
        .get('/:applicationId', applicationController.readApplication)
        /**
         * @swagger
         * /api/applications:
         *   get:
         *     summary: Get all applications with optional filtering and pagination
         *     tags: [Applications]
         *     parameters:
         *       - in: query
         *         name: page
         *         schema:
         *           type: integer
         *           default: 1
         *         description: Page number
         *       - in: query
         *         name: limit
         *         schema:
         *           type: integer
         *           default: 10
         *         description: Items per page
         *       - in: query
         *         name: sort
         *         schema:
         *           type: string
         *         description: Sort fields (format "field:direction,field2:direction2")
         *       - in: query
         *         name: [any application field]
         *         schema:
         *           type: string
         *         description: Filter by any application field
         *     responses:
         *       200:
         *         description: List of applications
         *       400:
         *         description: Invalid query parameters
         *       500:
         *         description: Server error
         */
        .get('', applicationController.readAllApplications)
        /**
         * @swagger
         * /api/applications/{applicationId}:
         *   patch:
         *     summary: Update an application
         *     tags: [Applications]
         *     parameters:
         *       - in: path
         *         name: applicationId
         *         schema:
         *           type: string
         *         required: true
         *         description: Application ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/ApplicationInput'
         *     responses:
         *       200:
         *         description: Application updated successfully
         *       400:
         *         description: Invalid input data
         *       404:
         *         description: Application not found
         *       500:
         *         description: Server error
         */
        .patch(
          '/:applicationId',
          authorizationMiddleware.isAuthorized(['candidate']),
          applicationController.updateApplication,
        )
        /**
         * @swagger
         * /api/applications/{applicationId}:
         *   delete:
         *     summary: Delete an application
         *     tags: [Applications]
         *     parameters:
         *       - in: path
         *         name: applicationId
         *         schema:
         *           type: string
         *         required: true
         *         description: Application ID
         *     responses:
         *       200:
         *         description: Application deleted successfully
         *       400:
         *         description: Invalid ID format
         *       404:
         *         description: Application not found
         *       500:
         *         description: Server error
         */
        .delete(
          '/:applicationId',
          authorizationMiddleware.isAuthorized(['candidate', 'admin']),
          applicationController.deleteApplication,
        )
    );
  }
}
