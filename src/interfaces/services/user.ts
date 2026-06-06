import { IUser } from '../models';

export interface IUserService {
  /**
   * Updates a user's contact information
   */
  updateContact: (id: string, data: Partial<IUser>) => Promise<void>;

  /**
   * Delete a user by ID
   */
  deleteAccount: (id: string) => Promise<{ message: string }>;
}
