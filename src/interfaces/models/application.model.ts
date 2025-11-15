import { ICandidate } from './candidate.model';
import { IJob } from './job.model';

interface IApplication {
  readonly id?: string;
  jobId?: string;
  job?: Partial<IJob>;
  candidateId?: string;
  candidate?: Partial<ICandidate>;
  status?: 'pending' | 'accepted' | 'rejected';
  coverLetter?: string;
  resumeUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export { IApplication };
