import { IApplication } from '../models';

/**
 * Query parameters for searching applications.
 */
interface IApplicationQuery {
  id?: string;
  jobId?: string;
  candidateId?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Paginated result for applications.
 */
interface IPaginatedApplications {
  applications: IApplication[];
  total: number;
  page: number;
}

export { IApplicationQuery, IPaginatedApplications };
