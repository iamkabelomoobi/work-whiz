import { candidateValidator } from '@work-whiz/validators';
import { ICandidate } from '@work-whiz/interfaces';
import { ValidationError } from 'joi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestCandidate = Partial<Record<keyof ICandidate, any>>;

describe('candidateValidator', () => {
  it('should return undefined for valid candidate data', () => {
    const validCandidate: Partial<ICandidate> = {
      title: 'Software Engineer',
      skills: ['JavaScript', 'TypeScript'],
      isEmployed: true,
    };

    const result = candidateValidator(validCandidate);

    expect(result).toBeUndefined();
  });

  it('should handle partial valid candidate data', () => {
    const partialCandidate: Partial<ICandidate> = {
      isEmployed: false,
    };

    const result = candidateValidator(partialCandidate);

    expect(result).toBeUndefined();
  });

  it('should return error for non-string title', () => {
    const invalidCandidate: TestCandidate = {
      title: 12345,
    };

    const result = candidateValidator(invalidCandidate);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.message).toContain('Title should be a string');
  });

  it('should return error for invalid skills array', () => {
    const invalidCandidate: TestCandidate = {
      skills: ['JavaScript', 12345],
    };

    const result = candidateValidator(invalidCandidate);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.message).toContain('Each skill should be a string');
  });

  it('should return error for non-boolean isEmployed', () => {
    const invalidCandidate: TestCandidate = {
      isEmployed: 'yes',
    };

    const result = candidateValidator(invalidCandidate);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.message).toContain('isEmployed should be a boolean');
  });

  it('should return multiple errors for multiple invalid fields', () => {
    const invalidCandidate: TestCandidate = {
      skills: ['JavaScript', 12345],
      isEmployed: 'maybe',
    };

    const result = candidateValidator(invalidCandidate);

    expect(result).toBeInstanceOf(ValidationError);
    expect(result?.details).toHaveLength(2);
  });

  it('should handle empty object', () => {
    const result = candidateValidator({});

    expect(result).toBeUndefined();
  });
});
