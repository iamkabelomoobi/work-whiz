import { Router } from 'express';
import { adminController } from '@work-whiz/controllers/admin.controller';
import { userController } from '@work-whiz/controllers/user.controller';
import {
  profileLimiter,
  authenticationMiddleware,
} from '@work-whiz/middlewares';

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Endpoints related to admin profiles
 */
export class AdminRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
    /**
     * @swagger
     * /api/admins/me:
     *   get:
     *     summary: Get current admin
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Admin data
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      '/me',
      profileLimiter,
      authenticationMiddleware.isAuthenticated,
      adminController.getAdmin,
    );

    /**
     * @swagger
     * /api/admins/me:
     *   patch:
     *     summary: Update current admin
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
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
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    this.router.patch(
      '/me',
      profileLimiter,
      authenticationMiddleware.isAuthenticated,
      adminController.updateAdmin,
    );

    /**
     * @swagger
     * /api/admins:
     *   get:
     *     summary: Get all admins
     *     tags: [Admin]
     *     security:
     *       - bearerAuth: []
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
     *       - in: query
     *         name: sort
     *         schema:
     *           type: string
     *           example: createdAt:desc
     *     responses:
     *       200:
     *         description: List of admins
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      '/',
      profileLimiter,
      authenticationMiddleware.isAuthenticated,
      adminController.getAllAdmins,
    );

    /**
     * @swagger
     * /api/admins/me/contact:
     *   patch:
     *     summary: Update admin contact info
     *     tags: [Admin]
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
     *                 example: "admin@example.com"
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
      authenticationMiddleware.isAuthenticated,
      userController.updateContact,
    );

    return this.router;
  }
}
