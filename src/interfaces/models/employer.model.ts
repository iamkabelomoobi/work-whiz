import { IUser } from './user.model';

interface IEmployer {
  readonly id?: string;
  name?: string;
  industry?: string;
  websiteUrl?: string;
  location?: string;
  description?: string;
  size?: number;
  foundedIn?: number;
  isVerified?: boolean;
  userId?: string;
  user?: Partial<IUser>;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export { IEmployer };
