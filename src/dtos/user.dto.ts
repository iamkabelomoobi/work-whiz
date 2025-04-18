import { IUser } from '../interfaces';

const toIUserDTO = (user: IUser): IUser => ({
  id: user.id,
  avatarUrl: user.avatarUrl,
  email: user.email,
  phone: user.phone,
  password: user.password,
  role: user.role,
  isVerified: user.isVerified,
  isActive: user.isActive,
  isLocked: user.isLocked,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export { toIUserDTO };
