import {
  AdminModel,
  ApplicationModel,
  CandidateModel,
  EmployerModel,
  JobModel,
  UserModel,
} from '@work-whiz/models';

export interface IModelDictionary {
  AdminModel: typeof AdminModel;
  ApplicationModel: typeof ApplicationModel;
  CandidateModel: typeof CandidateModel;
  EmployerModel: typeof EmployerModel;
  JobModel: typeof JobModel;
  UserModel: typeof UserModel;
}
