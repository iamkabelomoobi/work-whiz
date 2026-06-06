import { Role } from '@work-whiz/types/roles.type';

interface IUser {
  readonly id: string;
  name: string;
  image: string;
  email: string;
  emailVerified: boolean;
  phone: string;
  password: string;
  role: Role;
  isVerified: boolean;
  isActive: boolean;
  isLocked: boolean;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

export { IUser };
