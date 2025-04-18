import { Request, Response, NextFunction } from 'express';
import { UAParser } from 'ua-parser-js';

export const userAgentParser = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userAgent = req.headers['user-agent'];
  if (userAgent) {
    const parser = new UAParser();
    const result = parser.setUA(userAgent).getResult();
    console.error('results', result);
    req.app.locals.userAgent = {
      browser: result.browser.name,
      os: result.os.name,
    };
  } else {
    req.app.locals.userAgent = null;
  }
  next();
};
