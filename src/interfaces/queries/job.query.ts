import { IJob } from '../models';

export interface IJobQuery {
  id?: string;
  title?: string;
  location?: string;
  type?: string[];
  tags?: string[];
  isPublic?: boolean;
  employerName?: string;
  employerId?: string;
}

export interface IPaginatedJobs {
  jobs: IJob[];
  total: number;
  totalPages: number;
  currentPage: number;
  perPage: number;
}
