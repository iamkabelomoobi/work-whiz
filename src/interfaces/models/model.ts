import {
  Admin,
  Application,
  Candidate,
  Employer,
  Job,
  User,
} from '@prisma/client';

export interface IModelDictionary {
  AdminModel: Admin;
  ApplicationModel: Application;
  CandidateModel: Candidate;
  EmployerModel: Employer;
  JobModel: Job;
  UserModel: User;
}
