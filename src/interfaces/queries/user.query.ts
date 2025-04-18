import { Role } from '@work-whiz/types/roles.type';

interface IUserQuery {
  id?: string;
  email?: string;
  phone?: string;
  role?: Role;
  isActive?: boolean;
  isVerified?: boolean;
  isLocked?: boolean;
}

export { IUserQuery };
