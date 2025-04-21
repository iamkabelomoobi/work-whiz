import { candidateValidator } from '@work-whiz/validators';
import { ICandidate } from '@work-whiz/interfaces';
import { ValidationError } from 'joi';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TestCandidate = Partial<Record<keyof ICandidate, any>>;

describe('candidateValidator', () => {
  describe('successful validation', () => {
    it('should return undefined for valid candidate', () => {
      const validCandidate: Partial<ICandidate> = {
        firstName: 'John',
        lastName: 'Doe',
        title: 'Software Engineer',
        skills: ['JavaScript', 'TypeScript'],
        isEmployed: true,
      };

      const result = candidateValidator(validCandidate);
      expect(result).toBeUndefined();
    });

    it('should handle partial valid candidate', () => {
      const partialCandidate: Partial<ICandidate> = {
        firstName: 'Jane',
        isEmployed: false,
      };

      const result = candidateValidator(partialCandidate);
      expect(result).toBeUndefined();
    });
  });

  describe('validation errors', () => {
    it('should return error for invalid firstName', () => {
      const invalidCandidate: TestCandidate = {
        firstName: 'John123',
        lastName: 'Doe',
      };

      const result = candidateValidator(invalidCandidate);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result?.message).toContain('First name can only contain letters');
    });

    it('should return error for invalid lastName', () => {
      const invalidCandidate: TestCandidate = {
        firstName: 'John',
        lastName: 'Doe-Smith',
      };

      const result = candidateValidator(invalidCandidate);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result?.message).toContain('Last name can only contain letters');
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
        firstName: 'John1',
        lastName: 'Doe2',
        isEmployed: 'maybe',
      };

      const result = candidateValidator(invalidCandidate);
      expect(result).toBeInstanceOf(ValidationError);
      expect(result?.details).toHaveLength(3);
    });
  });

  describe('edge cases', () => {
    it('should handle empty object', () => {
      const result = candidateValidator({});
      expect(result).toBeUndefined();
    });
  });
});
