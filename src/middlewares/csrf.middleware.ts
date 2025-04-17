import { Request, Response, NextFunction } from 'express';
import { csrfUtil, responseUtil } from '@work-whiz/utils';
import { StatusCodes } from 'http-status-codes';

export const csrfCheckMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const isValid = csrfUtil.validate(req);

  if (!isValid) {
    responseUtil.sendError(
      res,
      { message: 'Invalid CSRF token.' },
      StatusCodes.FORBIDDEN
    );
  }

  next();
};
