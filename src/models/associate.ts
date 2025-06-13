import { IModelDictionary } from '@work-whiz/interfaces';
import { AdminModel } from './admin.model';
import { ApplicationModel } from './application.model';
import { CandidateModel } from './candidate.model';
import { EmployerModel } from './employer.model';
import { JobModel } from './job.model';
import { UserModel } from './user.model';

const models: IModelDictionary = {
  AdminModel,
  ApplicationModel,
  CandidateModel,
  EmployerModel,
  JobModel,
  UserModel,
};

const associateModels = () => {
  Object.values(models).forEach(model => {
    if ('associate' in model && typeof model.associate === 'function') {
      model.associate(models);
    }
  });
};

export { models, associateModels };
