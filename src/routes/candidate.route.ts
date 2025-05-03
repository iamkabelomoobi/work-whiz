import { Router } from 'express';
import { candidateController } from '@work-whiz/controllers/candidate.controller';
import { userController } from '@work-whiz/controllers';
import {
  profileLimiter,
  authorizationMiddleware,
} from '@work-whiz/middlewares';

/**
 * @swagger
 * tags:
 *   name: Candidate
 *   description: Endpoints related to candidate profiles
 */
export class CandidateRoutes {
  constructor(private readonly router: Router = Router()) {}

  public init(): Router {
    /**
     * @swagger
     * /api/candidates/me:
     *   get:
     *     summary: Get current candidate
     *     tags: [Candidate]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Candidate data
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      '/me',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['admin', 'candidate', 'employer']),
      candidateController.getCandidate,
    );

    /**
     * @swagger
     * /api/candidates:
     *   get:
     *     summary: Get all candidates
     *     tags: [Candidate]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of candidates
     *       401:
     *         description: Unauthorized
     */
    this.router.get(
      '/',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['admin', 'candidate', 'employer']),
      candidateController.getCandidates,
    );

    /**
     * @swagger
     * /api/candidates/me/contact:
     *   patch:
     *     summary: Update current candidate contact information
     *     tags: [Candidate]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Contact'
     *     responses:
     *       200:
     *         description: Contact updated successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    this.router.patch(
      '/me/contact',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['candidate']),
      userController.updateContact,
    );

    /**
     * @swagger
     * /api/candidates/me:
     *   patch:
     *     summary: Update current candidate
     *     tags: [Candidate]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Candidate'
     *     responses:
     *       200:
     *         description: Candidate updated successfully
     *       400:
     *         description: Validation error
     *       401:
     *         description: Unauthorized
     */
    this.router.patch(
      '/me',
      profileLimiter,
      authorizationMiddleware.isAuthorized(['candidate']),
      candidateController.updateCandidate,
    );

    /**
     * @swagger
     * /api/candidate/me/contact:
     *   patch:
     *     summary: Update candidate contact info
     *     tags: [Candidate]
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
     *                 example: "candidate@example.com"
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
      authorizationMiddleware.isAuthorized(['candidate']),
      userController.updateContact,
    );

    /**
     * @swagger
     * /api/candidates/me/password:
     *   patch:
     *     summary: Update candidate password
     *     tags: [Candidate]
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
      authorizationMiddleware.isAuthorized(['candidate']),
      userController.updatePassword,
    );

    /**
     * @swagger
     * /api/candidates/me:
     *   delete:
     *     summary: Delete current candidate account
     *     tags: [Candidate]
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
      authorizationMiddleware.isAuthorized(['candidate']),
      userController.deleteAccount,
    );

    return this.router;
  }
}
