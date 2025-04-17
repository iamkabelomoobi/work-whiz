import { candidateRegisterValidator } from '@work-whiz/validators/candidate-register.validator';

describe('candidateRegisterValidator', () => {
  it('should pass with valid data', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      title: 'Mr',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeUndefined(); // No errors expected
  });

  it('should fail with missing firstName', () => {
    const result = candidateRegisterValidator({
      firstName: '',
      lastName: 'Doe',
      title: 'Mr',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('First name cannot be empty');
  });

  it('should fail with invalid firstName (non-alphabetical)', () => {
    const result = candidateRegisterValidator({
      firstName: 'John123',
      lastName: 'Doe',
      title: 'Mr',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('First name can only contain letters');
  });

  it('should fail with missing lastName', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: '',
      title: 'Mr',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Last name cannot be empty');
  });

  it('should fail with invalid email', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      title: 'Mr',
      email: 'invalid-email',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Please enter a valid email address.');
  });

  it('should fail with missing phone', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      title: 'Mr',
      email: 'user@example.com',
      phone: '',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Phone number cannot be empty.');
  });

  it('should fail with invalid phone (no country code)', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      title: 'Mr',
      email: 'user@example.com',
      phone: '0712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should fail with missing title', () => {
    const result = candidateRegisterValidator({
      firstName: 'John',
      lastName: 'Doe',
      title: '',
      email: 'user@example.com',
      phone: '+254712345678',
    });

    expect(result).toBeDefined();
    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Title cannot be empty');
  });
});
