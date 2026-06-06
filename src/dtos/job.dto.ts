import { IJob } from '@work-whiz/interfaces';

export const toIJobDTO = (job: IJob): IJob => {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    responsibilities: job.responsibilities,
    requirements: job.requirements,
    benefits: job.benefits,
    location: job.location,
    type: job.type,
    vacancy: job.vacancy,
    deadline: job.deadline,
    tags: job.tags,
    employer: job.employer?.user
      ? {
          id: job.employer.id,
          image: job.employer.user.image,
          name: job.employer.user.name,
          email: job.employer.user.email,
          phone: job.employer.user.phone,
          industry: job.employer.industry,
          websiteUrl: job.employer.websiteUrl,
          location: job.employer.location,
          size: job.employer.size,
          foundedIn: job.employer.foundedIn,
          isVerified: job.employer.isVerified,
        }
      : undefined,
    views: job.views,
    isPublic: job.isPublic,
    createdAt: job.createdAt || new Date(),
    updatedAt: job.updatedAt || new Date(),
  };
};
