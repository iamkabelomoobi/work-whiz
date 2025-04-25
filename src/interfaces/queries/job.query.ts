export interface IJobQuery {
  id?: string;
  title?: string;
  location?: string;
  type?: string[];
  tags?: string[];
  isActive?: boolean;
  employerName?: string;
  employerId?: string;
}
