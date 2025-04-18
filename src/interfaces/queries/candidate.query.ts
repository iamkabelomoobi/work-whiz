import { TITLE_ENUM } from '@work-whiz/enums';

interface StringSearch {
  contains?: string;
  startsWith?: string;
  ilike?: string;
}

interface ArraySearch<T> {
  contains?: T[];
  overlaps?: T[];
  any?: T;
  all?: T[];
}

interface DateRange {
  before?: Date;
  after?: Date;
  between?: [Date, Date];
}

interface ICandidateQuery {
  id?: string;
  userId?: string;
  firstName?: string | StringSearch;
  lastName?: string | StringSearch;
  title?: (typeof TITLE_ENUM)[number] | Array<(typeof TITLE_ENUM)[number]>;
  skills?: ArraySearch<string>;
  isEmployed?: boolean;
  createdAt?: Date | DateRange;
  updatedAt?: Date | DateRange;
  search?: {
    term?: string;
    skills?: string[];
    employmentStatus?: boolean;
  };
}

export { ICandidateQuery, StringSearch, ArraySearch, DateRange };
