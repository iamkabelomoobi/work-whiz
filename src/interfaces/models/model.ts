import {
  AdminModel,
  CandidateModel,
  EmployerModel,
  JobModel,
  UserModel,
} from '@work-whiz/models';

export interface IModelDictionary {
  AdminModel: typeof AdminModel;
  CandidateModel: typeof CandidateModel;
  EmployerModel: typeof EmployerModel;
  JobModel: typeof JobModel;
  UserModel: typeof UserModel;
}
