import type { Context } from '@work-whiz/app/context';
import {
  adminService,
  candidateService,
  employerService,
} from '@work-whiz/services';
import {
  adminValidator,
  candidateValidator,
  employerValidator,
} from '@work-whiz/validators';
import type { IAdmin, ICandidate, IEmployer } from '@work-whiz/interfaces';
import type {
  AdminProfileInput,
  CandidateProfileInput,
  EmployerProfileInput,
} from '../graphql/inputs';
import { assertValid } from './validation';

export const updateCandidateProfile = async (
  input: Partial<CandidateProfileInput>,
  context: Context,
) => {
  const user = context.assertCandidate();
  const data = input as Partial<ICandidate>;
  assertValid(candidateValidator(data));
  return candidateService.update(user.id, data);
};

export const updateEmployerProfile = async (
  input: Partial<EmployerProfileInput>,
  context: Context,
) => {
  const user = context.assertEmployer();
  const data = input as Partial<IEmployer>;
  assertValid(employerValidator(data));
  return employerService.update(user.id, data);
};

export const updateAdminProfile = async (
  input: Partial<AdminProfileInput>,
  context: Context,
) => {
  const user = context.assertAdmin();
  const data = input as Partial<IAdmin>;
  assertValid(adminValidator(data));
  return adminService.update(user.id, data);
};
