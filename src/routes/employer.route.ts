import { Router } from 'express';
import { authorizationMiddleware } from '../middlewares/authorization.middleware';
import { employerController, userController } from '../controllers';
import { profileLimiter } from '@work-whiz/middlewares';

export class EmployerRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
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
    this.router.get(
      '/me',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['employer', 'admin']),
      employerController.getEmployer,
    );

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
    this.router.patch(
      '/me',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['employer', 'admin']),
      employerController.updateEmployer,
    );

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
    this.router.get('/', profileLimiter, employerController.getEmployers);

    /**
     * @swagger
     * /employers/me/contact:
     *   patch:
     *     summary: Update employer contact info
     *     tags: [Employers]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               phone:
     *                 type: string
     *                 example: "+2348123456789"
     *               email:
     *                 type: string
     *                 format: email
     *                 example: "employer@example.com"
     *     responses:
     *       200:
     *         description: Contact info updated
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    this.router.patch(
      '/me/contact',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['employer']),
      userController.updateContact,
    );

    /**
     * @swagger
     * /employers/me/password:
     *   patch:
     *     summary: Update employer password
     *     tags: [Employers]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               currentPassword:
     *                 type: string
     *                 example: "currentpassword123"
     *               newPassword:
     *                 type: string
     *                 example: "newpassword123"
     *     responses:
     *       200:
     *         description: Password updated successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    this.router.patch(
      '/me/password',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['employer']),
      userController.updatePassword,
    );

    /**
     * @swagger
     * /employers/me:
     *   delete:
     *     summary: Delete current employer account
     *     tags: [Employers]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Account deleted successfully
     *       401:
     *         description: Unauthorized
     */
    this.router.delete(
      '/me',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['employer']),
      userController.deleteAccount,
    );

    return this.router;
  }
}
