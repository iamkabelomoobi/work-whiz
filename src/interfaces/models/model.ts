import {
  AdminModel,
  CandidateModel,
  EmployerModel,
  UserModel,
} from '@work-whiz/models';

export interface IModelDictionary {
  AdminModel: typeof AdminModel;
  CandidateModel: typeof CandidateModel;
  EmployerModel: typeof EmployerModel;
  UserModel: typeof UserModel;
}
