import { Router } from 'express';
import { adminController } from '@work-whiz/controllers/admin.controller';
import { userController } from '@work-whiz/controllers/user.controller';
import {
  profileLimiter,
  authenticationMiddleware,
} from '@work-whiz/middlewares';

export class AdminRoutes {
  constructor(private readonly router: Router = Router()) {
    //
  }

  public init(): Router {
    return (
      this.router
        /**
         * @route GET /admins/me
         * @description Retrieves an admin
         */
        .get(
          '/me',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          adminController.getAdmin,
        )
        /**
         * @route PATCH /admins/me
         * @description Updates an admin
         */
        .patch(
          '/me',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          adminController.updateAdmin,
        )
        /**
         * @route GET /admins
         * @description Retrieves all admins
         */
        .get(
          '/',
          profileLimiter,
          authenticationMiddleware.isAuthenticated,
          adminController.getAllAdmins,
        )
        /**
         * @route PATCH /admins/me/contact
         * @description Updates admin's contact details
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
