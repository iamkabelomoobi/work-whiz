import { Prisma, PrismaClient } from '@prisma/client';

export type PrismaRepositoryClient = PrismaClient | Prisma.TransactionClient;

export const getPrismaOrderBy = (
  sort?: Record<string, 'ASC' | 'DESC'>,
): Record<string, 'asc' | 'desc'>[] | undefined => {
  if (!sort) {
    return undefined;
  }

  return Object.entries(sort).map(([field, direction]) => ({
    [field]: direction.toLowerCase() as 'asc' | 'desc',
  }));
};

export const userSelectWithoutPassword = {
  id: true,
  avatarUrl: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  isActive: true,
  isLocked: true,
  createdAt: true,
  updatedAt: true,
} as const;

