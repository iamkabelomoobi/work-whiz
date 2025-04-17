import { Permissions } from '@work-whiz/types';
import { IUser } from './user.model';

interface IAdmin {
  readonly id: string;
  firstName?: string;
  lastName?: string;
  permissions?: Array<Permissions>;
  userId?: string;
  user?: Partial<IUser>;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}
export { IAdmin };
