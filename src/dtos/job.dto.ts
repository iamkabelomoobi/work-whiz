import { IJob } from '@work-whiz/interfaces';

export const toIJobDTO = (job: IJob): IJob => {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    responsibility: job.responsibility,
    requirements: job.requirements,
    benefits: job.benefits,
    location: job.location,
    type: job.type,
    vacancy: job.vacancy,
    deadline: job.deadline,
    tags: job.tags,
    employer: job.employer
      ? {
          id: job.employer.id,
          avatarUrl: job.employer.user.avatarUrlavatarUrl,
          name: job.employer.name,
          email: job.employer.user.email,
          phone: job.employer.user.phone,
          industry: job.employer.industry,
          websiteUrl: job.employer.websiteUrl,
          location: job.employer.location,
          size: job.employer.size,
          foundedIn: job.employer.foundedIn,
          isVerified: job.employer.isVerified,
        }
      : null,
    views: job.views,
    isActive: job.isActive,
    createdAt: job.createdAt || new Date(),
    updatedAt: job.updatedAt || new Date(),
  };
};
