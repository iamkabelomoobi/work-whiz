import { ICandidate } from '@work-whiz/interfaces';

export const toICandidateDTO = (candidate: ICandidate): ICandidate => {
  return {
    id: candidate.id,
    title: candidate.title,
    skills: candidate.skills,
    isEmployed: candidate.isEmployed,
    user: candidate.user
      ? {
          id: candidate.user.id,
          name: candidate.user.name,
          image: candidate.user.image,
          email: candidate.user.email,
          emailVerified: candidate.user.emailVerified,
          phone: candidate.user.phone,
          role: candidate.user.role,
          isVerified: candidate.user.isVerified,
          isActive: candidate.user.isActive,
          isLocked: candidate.user.isLocked,
          createdAt: candidate.user.createdAt || new Date(),
          updatedAt: candidate.user.updatedAt || new Date(),
        }
      : undefined,
  };
};
