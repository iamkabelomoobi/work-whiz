import { builder } from '@work-whiz/app/builder';
import {
  updateAdminProfile,
  updateCandidateProfile,
  updateEmployerProfile,
} from '../mutations';
import {
  AdminProfileInput,
  CandidateProfileInput,
  EmployerProfileInput,
} from './inputs';
import { MessageObject } from './types';
import { ICandidate } from '@work-whiz/interfaces/models/candidate.model';
import { candidateValidator } from '@work-whiz/validators/candidate.validator';
import { assertValid } from '@work-whiz/utils/validation';
import { candidateService } from '@work-whiz/services';

builder.mutationField('updateCandidateProfile', t =>
  t.field({
    type: MessageObject,
    nullable: false,
    authScopes: { isCandidate: true },
    args: {
      input: t.arg({ type: CandidateProfileInput, required: true }),
    },
    resolve: async (_root, args, context) => {
      const user = context.assertCandidate();

      assertValid(candidateValidator(args.input as Partial<ICandidate>));
      return candidateService.update(
        user.id,
        args.input as Partial<ICandidate>,
      );
    },
  }),
);

builder.mutationField('updateEmployerProfile', t =>
  t.field({
    type: MessageObject,
    nullable: false,
    authScopes: { isEmployer: true },
    args: {
      input: t.arg({ type: EmployerProfileInput, required: true }),
    },
    resolve: async (_root, args, context) =>
      updateEmployerProfile(args.input, context),
  }),
);

builder.mutationField('updateAdminProfile', t =>
  t.field({
    type: MessageObject,
    nullable: false,
    authScopes: { isAdmin: true },
    args: {
      input: t.arg({ type: AdminProfileInput, required: true }),
    },
    resolve: async (_root, args, context) =>
      updateAdminProfile(args.input, context),
  }),
);
