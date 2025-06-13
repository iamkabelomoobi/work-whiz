import { config } from '@work-whiz/configs/config';
import { Role } from '@work-whiz/types';

/**
 * Maps user roles to their corresponding frontend URLs from the configuration.
 */
const roleToFrontend: Record<string, string | undefined> = {
  admin: config.frontend.admin,
  candidate: config.frontend.candidate,
  employer: config.frontend.employer,
};

/**
 * Returns the frontend URL for a given user role.
 *
 * @param {Role} role - The user role ('admin', 'candidate', or 'employer').
 * @returns {string} The corresponding frontend URL from the configuration.
 * @throws {Error} If the role is invalid or not supported.
 *
 * @example
 * createFrontendUrl('admin'); // returns config.frontend.admin
 * createFrontendUrl('candidate'); // returns config.frontend.candidate
 */
export const createFrontendUrl = (role: Role): string => {
  const url = roleToFrontend[role.toLocaleLowerCase()];
  if (!url) throw new Error(`Invalid user role: ${role}`);
  return url;
};
