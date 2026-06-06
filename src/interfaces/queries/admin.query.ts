import { Permissions } from '@work-whiz/types';

interface IAdminQuery {
  id?: string;
  permissions?: Array<Permissions>;
  userId?: string;
}

export { IAdminQuery };
