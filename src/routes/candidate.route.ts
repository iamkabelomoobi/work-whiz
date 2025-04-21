import { Router } from 'express';
import { candidateController } from '@work-whiz/controllers/candidate.controller';
import { userController } from '@work-whiz/controllers';
import { profileLimiter, authorizationMiddleare } from '@work-whiz/middlewares';

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
      authorizationMiddleare.isAuthorized,
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
      authorizationMiddleare.isAuthorized,
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
      authorizationMiddleare.isAuthorized,
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
      authorizationMiddleare.isAuthorized,
      candidateController.updateCandidate,
    );

    return this.router;
  }
}
