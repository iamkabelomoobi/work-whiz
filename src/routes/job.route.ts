import { Router } from 'express';
import { jobController } from '@work-whiz/controllers';
import { authorizationMiddleware } from '@work-whiz/middlewares';

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management endpoints
 *
 * components:
 *   schemas:
 *     Job:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the job
 *         title:
 *           type: string
 *           description: The job title
 *         description:
 *           type: string
 *           description: The job description
 *         company:
 *           type: string
 *           description: The company name
 *         location:
 *           type: string
 *           description: The job location
 *         salary:
 *           type: number
 *           description: The job salary
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The last update timestamp
 *       required:
 *         - title
 *         - description
 *         - company
 *         - location
 *
 *     JobInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         company:
 *           type: string
 *         location:
 *           type: string
 *         salary:
 *           type: number
 *       required:
 *         - title
 *         - description
 *         - company
 *         - location
 */
export class JobRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
    return (
      this.router
        /**
         * @swagger
         * /api/jobs/job:
         *   post:
         *     summary: Create a new job
         *     tags: [Jobs]
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/JobInput'
         *     responses:
         *       201:
         *         description: Job created successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Job'
         *       400:
         *         description: Invalid input data
         *       500:
         *         description: Server error
         */
        .post(
          '',
          authorizationMiddleware.isAuthorized(['employer']),
          jobController.createJob,
        )
        /**
         * @swagger
         * /api/jobs/job/{id}:
         *   get:
         *     summary: Get a job by ID
         *     tags: [Jobs]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Job ID
         *     responses:
         *       200:
         *         description: Job data
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Job'
         *       400:
         *         description: Invalid ID format
         *       404:
         *         description: Job not found
         *       500:
         *         description: Server error
         */
        .get('/job/:jobId', jobController.readJob)
        /**
         * @swagger
         * /api/jobs:
         *   get:
         *     summary: Get all jobs with optional filtering and pagination
         *     tags: [Jobs]
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
         *         name: [any job field]
         *         schema:
         *           type: string
         *         description: Filter by any job field
         *     responses:
         *       200:
         *         description: List of jobs
         *         content:
         *           application/json:
         *             schema:
         *               type: object
         *               properties:
         *                 success:
         *                   type: boolean
         *                 payload:
         *                   type: array
         *                   items:
         *                     $ref: '#/components/schemas/Job'
         *       400:
         *         description: Invalid query parameters
         *       500:
         *         description: Server error
         */
        .get('', jobController.readAllJobs)
        /**
         * @swagger
         * /api/jobs/job/{id}:
         *   patch:
         *     summary: Update a job
         *     tags: [Jobs]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Job ID
         *     requestBody:
         *       required: true
         *       content:
         *         application/json:
         *           schema:
         *             $ref: '#/components/schemas/JobInput'
         *     responses:
         *       200:
         *         description: Job updated successfully
         *         content:
         *           application/json:
         *             schema:
         *               $ref: '#/components/schemas/Job'
         *       400:
         *         description: Invalid input data
         *       404:
         *         description: Job not found
         *       500:
         *         description: Server error
         */
        .patch(
          '/job/:jobId',
          authorizationMiddleware.isAuthorized(['employer']),
          jobController.updateJob,
        )
        /**
         * @swagger
         * /api/jobs/job/{id}:
         *   delete:
         *     summary: Delete a job
         *     tags: [Jobs]
         *     parameters:
         *       - in: path
         *         name: id
         *         schema:
         *           type: string
         *         required: true
         *         description: Job ID
         *     responses:
         *       200:
         *         description: Job deleted successfully
         *       400:
         *         description: Invalid ID format
         *       404:
         *         description: Job not found
         *       500:
         *         description: Server error
         */
        .delete(
          '/job/:jobId',
          authorizationMiddleware.isAuthorized(['employer', 'admin']),
          jobController.deleteJob,
        )
    );
  }
}
