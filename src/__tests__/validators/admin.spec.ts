import { adminValidator } from '@work-whiz/validators/admin.validator';
import { IAdmin } from '@work-whiz/interfaces';

describe('adminValidator', () => {
  it('should not return error when permissions are valid', () => {
    const validAdmin: Partial<IAdmin> = { permissions: ['READ'] };

    const result = adminValidator(validAdmin);

    expect(result).toBeUndefined();
  });

  it('should not return error when profile update is empty', () => {
    const result = adminValidator({});

    expect(result).toBeUndefined();
  });

  it('should return error when permissions are not strings', () => {
    const invalidAdmin = { permissions: [123] };

    const result = adminValidator(invalidAdmin as unknown as Partial<IAdmin>);

    expect(result).toBeDefined();
    expect(result?.details[0].message).toBe('Each permission should be a string');
  });
});
