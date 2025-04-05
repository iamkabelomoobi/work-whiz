import {baseRegisterSchema} from '@work-whiz/validators/schemas/base-register.schema'

describe('baseRegisterSchema', () => {
  it('should pass validation with valid email and phone', () => {
    const result = baseRegisterSchema.validate({
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result.error).toBeUndefined();
  });

  it('should fail when email is missing', () => {
    const result = baseRegisterSchema.validate({
      phone: '+254712345678',
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toMatch(/Email is required/);
  });

  it('should fail when phone is missing', () => {
    const result = baseRegisterSchema.validate({
      email: 'user@example.com',
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toMatch(/Phone number is required/);
  });

  it('should fail with invalid email', () => {
    const result = baseRegisterSchema.validate({
      email: 'invalid-email',
      phone: '+254712345678',
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toBe('Please enter a valid email address.');
  });

  it('should fail with invalid phone (no country code)', () => {
    const result = baseRegisterSchema.validate({
      email: 'user@example.com',
      phone: '0712345678',
    });

    expect(result.error).toBeDefined();
    expect(result.error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.'
    );
  });

  it('should fail with completely empty object', () => {
    const result = baseRegisterSchema.validate({}, { abortEarly: false });

    expect(result.error).toBeDefined();
    const messages = result.error?.details.map((d) => d.message);
    
    expect(messages).toContain('Email is required and cannot be empty.');
    expect(messages).toContain('Phone number is required.');
  });
});
