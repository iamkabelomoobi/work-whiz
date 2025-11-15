import { IApplication } from '@work-whiz/interfaces';

export const toApplicationDTO = (application: IApplication): IApplication => {
  return {
    id: application.id,
    jobId: application.jobId,
    job: application.job,
    candidate: application.candidate,
    status: application.status,
    coverLetter: application.coverLetter,
    resumeUrl: application.resumeUrl,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
  };
};
