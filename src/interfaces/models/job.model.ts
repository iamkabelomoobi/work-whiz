import { IEmployer } from './employer.model';
export interface IJob {
  id?: string;
  title: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits?: string[];
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  vacancy?: number;
  deadline: Date;
  tags: string[];
  employerId?: string;
  employer?: Partial<IEmployer> & {
    avatarUrl?: string;
    email?: string;
    phone?: string;
  };
  views?: number;
  isPublic?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
