import { AdminModel } from './admin.model';
import { CandidateModel } from './candidate.model';
import { EmployerModel } from './employer.model';
import { UserModel } from './user.model';

const models = {
  AdminModel,
  CandidateModel,
  EmployerModel,
  UserModel,
};

const associateModels = () => {
  Object.values(models).forEach((model) => {
    if (model.associate) {
      model.associate(models);
    }
  });
};

export { models, associateModels };
