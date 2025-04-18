import { IAdmin } from '@work-whiz/interfaces';

export const toIAdminDTO = (admin: IAdmin): IAdmin => {
  return {
    id: admin.id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    permissions: admin.permissions,
    user: admin.user
      ? {
          id: admin.user.id,
          avatarUrl: admin.user.avatarUrl,
          email: admin.user.email,
          phone: admin.user.phone,
          role: admin.user.role,
          isVerified: admin.user.isVerified,
          isActive: admin.user.isActive,
          isLocked: admin.user.isLocked,
          createdAt: admin.user.createdAt || new Date(),
          updatedAt: admin.user.updatedAt || new Date(),
        }
      : null,
  };
};
