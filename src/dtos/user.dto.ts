import { IUser } from '../interfaces';

const toIUserDTO = (user: IUser): IUser => ({
  id: user.id,
  name: user.name,
  image: user.image,
  email: user.email,
  emailVerified: user.emailVerified,
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
