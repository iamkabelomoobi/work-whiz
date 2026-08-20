import type { Context } from '@work-whiz/app/context';
import {
  adminService,
  candidateService,
  employerService,
} from '@work-whiz/services';
import type { IPaginationQueryOptions } from '@work-whiz/interfaces';

type PaginationArgs = {
  page?: number | null;
  limit?: number | null;
};

const paginationOptions = (args: PaginationArgs): IPaginationQueryOptions => ({
  page: args.page ?? 1,
  limit: args.limit ?? 10,
});

export const getCandidateProfile = async (context: Context) => {
  const user = context.assertRole(['admin', 'candidate', 'employer']);
  return candidateService.findOne({ userId: user.id });
};

export const getEmployerProfile = async (context: Context) => {
  const user = context.assertRole(['admin', 'employer']);
  return employerService.findOne({ userId: user.id });
};

export const getAdminProfile = async (context: Context) => {
  const user = context.assertAdmin();
  return adminService.findOne({ userId: user.id });
};

export const getCandidates = async (args: PaginationArgs, context: Context) => {
  context.assertRole(['admin', 'candidate', 'employer']);
  return candidateService.findAll({}, paginationOptions(args));
};

export const getEmployers = async (args: PaginationArgs, context: Context) => {
  context.assertAuth();
  return employerService.findAll({}, paginationOptions(args));
};

export const getAdmins = async (args: PaginationArgs, context: Context) => {
  context.assertAdmin();
  return adminService.findAll({}, paginationOptions(args));
};
