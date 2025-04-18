import { doubleCsrf } from 'csrf-csrf';
import { Request, Response } from 'express';

const { generateToken, doubleCsrfProtection, validateRequest } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-secret-change-me',
  cookieName: '__Host-psifi.x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  },
  size: 64,
});

export const csrfUtil = {
  /**
   * Generates and sets CSRF token
   * @param {Request} req - Express request
   * @param {Response} res - Express response
   * @returns {string} Generated token
   */
  generate: (req: Request, res: Response): string => {
    return generateToken(req, res); // Now passing both arguments
  },

  /**
   * Express middleware for CSRF protection
   */
  protect: doubleCsrfProtection,

  /**
   * Validates CSRF token
   * @param {Request} req - Express request
   * @param {boolean} [throwOnInvalid=false] - Throw error if invalid
   */
  validate: (req: Request, throwOnInvalid = false): boolean => {
    try {
      const isValid = validateRequest(req);
      if (!isValid && throwOnInvalid) {
        throw new Error('Invalid CSRF token');
      }
      return isValid;
    } catch {
      if (throwOnInvalid) throw new Error('CSRF validation failed');
      return false;
    }
  },
};
