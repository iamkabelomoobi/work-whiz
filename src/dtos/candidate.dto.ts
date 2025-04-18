import { ICandidate } from '@work-whiz/interfaces';

export const toICandidateDTO = (candidate: ICandidate): ICandidate => {
  return {
    id: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    title: candidate.title,
    skills: candidate.skills,
    isEmployed: candidate.isEmployed,
    user: candidate.user
      ? {
          id: candidate.user.id,
          avatarUrl: candidate.user.avatarUrl,
          email: candidate.user.email,
          phone: candidate.user.phone,
          role: candidate.user.role,
          isVerified: candidate.user.isVerified,
          isActive: candidate.user.isActive,
          isLocked: candidate.user.isLocked,
          createdAt: candidate.user.createdAt || new Date(),
          updatedAt: candidate.user.updatedAt || new Date(),
        }
      : null,
  };
};
