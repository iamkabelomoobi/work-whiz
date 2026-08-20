import { builder } from '@work-whiz/app/builder';
import {
  getAdminProfile,
  getAdmins,
  getCandidateProfile,
  getCandidates,
  getEmployerProfile,
  getEmployers,
} from '../queries';
import {
  AdminConnectionObject,
  AdminProfileObject,
  CandidateConnectionObject,
  CandidateProfileObject,
  EmployerConnectionObject,
  EmployerProfileObject,
} from './types';

builder.queryField('candidateProfile', t =>
  t.field({
    type: CandidateProfileObject,
    nullable: true,
    authScopes: { isAuthenticated: true },
    resolve: async (_root, _args, context) => getCandidateProfile(context),
  }),
);

builder.queryField('employerProfile', t =>
  t.field({
    type: EmployerProfileObject,
    nullable: true,
    authScopes: { isAuthenticated: true },
    resolve: async (_root, _args, context) => getEmployerProfile(context),
  }),
);

builder.queryField('adminProfile', t =>
  t.field({
    type: AdminProfileObject,
    nullable: true,
    authScopes: { isAdmin: true },
    resolve: async (_root, _args, context) => getAdminProfile(context),
  }),
);

builder.queryField('candidates', t =>
  t.field({
    type: CandidateConnectionObject,
    nullable: false,
    authScopes: { isAuthenticated: true },
    args: {
      page: t.arg.int({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, context) => getCandidates(args, context),
  }),
);

builder.queryField('employers', t =>
  t.field({
    type: EmployerConnectionObject,
    nullable: false,
    authScopes: { isAuthenticated: true },
    args: {
      page: t.arg.int({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, context) => getEmployers(args, context),
  }),
);

builder.queryField('admins', t =>
  t.field({
    type: AdminConnectionObject,
    nullable: false,
    authScopes: { isAdmin: true },
    args: {
      page: t.arg.int({ required: false }),
      limit: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, context) => getAdmins(args, context),
  }),
);
