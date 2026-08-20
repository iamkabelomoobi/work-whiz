import { builder } from '@work-whiz/app/builder';
import { getMe } from '../queries';
import { UserObject } from './types';

builder.queryField('me', t =>
  t.field({
    type: UserObject,
    nullable: false,
    authScopes: { isAuthenticated: true },
    description: 'Returns the currently authenticated user.',
    resolve: (_root, _args, context) => getMe(context),
  }),
);
