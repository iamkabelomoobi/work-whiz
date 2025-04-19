import { adminValidator } from '@work-whiz/validators/admin.validator';
import { IAdmin } from '@work-whiz/interfaces';

describe('adminValidator', () => {
  describe('firstName validation', () => {
    it('should return error when firstName contains numbers', () => {
      const invalidAdmin: Partial<IAdmin> = { firstName: 'John123' };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe(
        'First name can only contain letters',
      );
    });

    it('should return error when firstName is empty string', () => {
      const invalidAdmin: Partial<IAdmin> = { firstName: '' };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe('First name cannot be empty');
    });

    it('should return error when firstName is not a string', () => {
      const invalidAdmin: Partial<IAdmin> = { firstName: 123 as any };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe('First name should be a string');
    });

    it('should not return error when firstName is valid', () => {
      const validAdmin: Partial<IAdmin> = { firstName: 'John' };
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });

    it('should not return error when firstName is undefined', () => {
      const validAdmin: Partial<IAdmin> = { firstName: undefined };
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });
  });

  describe('lastName validation', () => {
    it('should return error when lastName contains numbers', () => {
      const invalidAdmin: Partial<IAdmin> = { lastName: 'Doe123' };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe(
        'Last name can only contain letters',
      );
    });

    it('should return error when lastName is empty string', () => {
      const invalidAdmin: Partial<IAdmin> = { lastName: '' };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe('Last name cannot be empty');
    });

    it('should return error when lastName is not a string', () => {
      const invalidAdmin: Partial<IAdmin> = { lastName: 123 as any };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details[0].message).toBe('Last name should be a string');
    });

    it('should not return error when lastName is valid', () => {
      const validAdmin: Partial<IAdmin> = { lastName: 'Doe' };
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });

    it('should not return error when lastName is undefined', () => {
      const validAdmin: Partial<IAdmin> = { lastName: undefined };
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });
  });

  describe('combined validation', () => {
    it('should return multiple errors when both firstName and lastName are invalid', () => {
      const invalidAdmin: Partial<IAdmin> = {
        firstName: 'John123',
        lastName: 'Doe456',
      };
      const result = adminValidator(invalidAdmin);
      expect(result).toBeDefined();
      expect(result?.details).toHaveLength(2);
      expect(result?.details[0].message).toBe(
        'First name can only contain letters',
      );
      expect(result?.details[1].message).toBe(
        'Last name can only contain letters',
      );
    });

    it('should not return error when both firstName and lastName are valid', () => {
      const validAdmin: Partial<IAdmin> = {
        firstName: 'John',
        lastName: 'Doe',
      };
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });

    it('should not return error when both firstName and lastName are undefined', () => {
      const validAdmin: Partial<IAdmin> = {};
      const result = adminValidator(validAdmin);
      expect(result).toBeUndefined();
    });
  });
});
