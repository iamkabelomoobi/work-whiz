import { ICandidate } from '@work-whiz/interfaces';
import { candidateSchema } from './schemas/candidate.schema';

export const candidateValidator = (candidate: Partial<ICandidate>) => {
  const { error } = candidateSchema.validate(candidate, {
    abortEarly: false,
  });

  if (error) {
    return error;
  }
};
