/* eslint-disable @typescript-eslint/no-explicit-any */
import { ValidationError } from 'class-validator';

declare global {
  namespace Express {
    interface Request {
      validationErrors?: string[] | ValidationError[];
      validatedBody?: any;
    }
  }
}
