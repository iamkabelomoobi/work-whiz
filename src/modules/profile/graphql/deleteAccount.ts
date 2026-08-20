import { builder } from '@work-whiz/app/builder';
import { deleteAccount } from '../mutations';
import { MessageObject } from './types';

builder.mutationField('deleteAccount', t =>
  t.field({
    type: MessageObject,
    nullable: false,
    authScopes: { isAuthenticated: true },
    resolve: async (_root, _args, context) => deleteAccount(context),
  }),
);
