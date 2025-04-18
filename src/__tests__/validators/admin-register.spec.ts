import { adminRegisterValidator } from '@work-whiz/validators/admin-register.validator';

describe('adminRegisterValidator', () => {
  it('should pass with valid data', () => {
    const result = adminRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeUndefined();
  });

  it('should fail with missing firstName', () => {
    const result = adminRegisterValidator({
      firstName: '',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('First name cannot be empty');
  });

  it('should fail with invalid firstName (non-alphabetical)', () => {
    const result = adminRegisterValidator({
      firstName: 'John123',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('First name can only contain letters');
  });

  it('should fail with missing lastName', () => {
    const result = adminRegisterValidator({
      firstName: 'John',
      lastName: '',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Last name cannot be empty');
  });

  it('should fail with invalid email', () => {
    const result = adminRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      email: 'invalid-email',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Please enter a valid email address.');
  });

  it('should fail with missing phone', () => {
    const result = adminRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Phone number cannot be empty.');
  });

  it('should fail with invalid phone (no country code)', () => {
    const result = adminRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      email: 'user@example.com',
      phone: '0712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain(
      'Please enter a valid phone number with country code.',
    );
  });
});
