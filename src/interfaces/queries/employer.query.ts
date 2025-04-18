interface StringSearch {
  exact?: string;
  contains?: string;
  startsWith?: string;
  ilike?: string;
}

interface IEmployerQuery {
  id?: string;
  userId?: string;
  name?: string | StringSearch;
  industry?: string | string[];
  location?: string | StringSearch;
  size?: string | string[];
  isVerified?: boolean;
  description?: string | StringSearch;
  search?: {
    term?: string;
    industries?: string[];
    minSize?: number;
    maxSize?: number;
    locationRadius?: {
      coordinates: [number, number];
      radius: number;
    };
  };
  createdAt?:
    | Date
    | {
        before?: Date;
        after?: Date;
        between?: [Date, Date];
      };
  orderBy?: 'name' | 'size' | 'createdAt';
  orderDirection?: 'ASC' | 'DESC';
}

export { IEmployerQuery, StringSearch };
