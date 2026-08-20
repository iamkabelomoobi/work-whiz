import SchemaBuilder from '@pothos/core';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import SimpleObjectsPlugin from '@pothos/plugin-simple-objects';
import type { Context } from './context';

export const builder = new SchemaBuilder<{
  Context: Context;
  AuthScopes: {
    isAuthenticated: boolean;
    isAdmin: boolean;
    isCandidate: boolean;
    isEmployer: boolean;
  };
}>({
  plugins: [ScopeAuthPlugin, SimpleObjectsPlugin],
  scopeAuth: {
    authScopes: context => ({
      isAuthenticated: context.isAuthenticated,
      isAdmin: context.isAdmin,
      isCandidate: context.isCandidate,
      isEmployer: context.isEmployer,
    }),
  },
});

builder.queryType({});
builder.mutationType({});
