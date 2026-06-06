import { IEmployer } from '@work-whiz/interfaces';

export const toIEmployerDTO = (employer: IEmployer): IEmployer => {
  return {
    id: employer.id,
    industry: employer.industry,
    websiteUrl: employer.websiteUrl,
    location: employer.location,
    description: employer.description,
    size: employer.size,
    foundedIn: employer.foundedIn,
    isVerified: employer.isVerified,
    user: employer.user
      ? {
          id: employer.user.id,
          name: employer.user.name,
          image: employer.user.image,
          email: employer.user.email,
          emailVerified: employer.user.emailVerified,
          phone: employer.user.phone,
          role: employer.user.role,
          isVerified: employer.user.isVerified,
          isActive: employer.user.isActive,
          isLocked: employer.user.isLocked,
          createdAt: employer.user.createdAt || new Date(),
          updatedAt: employer.user.updatedAt || new Date(),
        }
      : undefined,
  };
};
