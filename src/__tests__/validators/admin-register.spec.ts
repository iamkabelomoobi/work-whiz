import { adminRegisterValidator } from '@work-whiz/validators/admin-register.validator';

const validPayload = {
  name: 'Admin User',
  email: 'user@example.com',
  password: 'StrongPass123!',
  phone: '+254712345678',
};

describe('adminRegisterValidator', () => {
  it('should pass with valid data', () => {
    const result = adminRegisterValidator(validPayload);

    expect(result).toBeUndefined();
  });

  it('should fail with missing name', () => {
    const result = adminRegisterValidator({ ...validPayload, name: '' });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain('Name cannot be empty');
  });

  it('should fail with invalid email', () => {
    const result = adminRegisterValidator({
      ...validPayload,
      email: 'invalid-email',
    });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Please enter a valid email address.',
    );
  });

  it('should fail with missing phone', () => {
    const result = adminRegisterValidator({ ...validPayload, phone: '' });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Phone number cannot be empty.',
    );
  });

  it('should fail with invalid phone', () => {
    const result = adminRegisterValidator({
      ...validPayload,
      phone: '0712345678',
    });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Please enter a valid phone number with country code.',
    );
  });
});
