import { builder } from '@work-whiz/app/builder';
import { updateContact } from '../mutations';
import { ContactInput } from './inputs';
import { MessageObject } from './types';


builder.mutationField('updateContact', t =>
  t.field({
    type: MessageObject,
    nullable: false,
    authScopes: { isAuthenticated: true },
    args: {
      input: t.arg({ type: ContactInput, required: true }),
    },
    resolve: async (_root, args, context) => updateContact(args.input, context),
  }),
);
