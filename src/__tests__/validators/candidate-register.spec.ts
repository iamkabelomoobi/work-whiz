import { candidateRegisterValidator } from '@work-whiz/validators/candidate-register.validator';

const validPayload = {
  name: 'Candidate User',
  title: 'Mr',
  email: 'user@example.com',
  password: 'StrongPass123!',
  phone: '+254712345678',
};

describe('candidateRegisterValidator', () => {
  it('should pass with valid data', () => {
    const result = candidateRegisterValidator(validPayload);

    expect(result).toBeUndefined();
  });

  it('should fail with missing name', () => {
    const result = candidateRegisterValidator({ ...validPayload, name: '' });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain('Name cannot be empty');
  });

  it('should fail with missing title', () => {
    const result = candidateRegisterValidator({ ...validPayload, title: '' });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain('Title cannot be empty');
  });

  it('should fail with invalid email', () => {
    const result = candidateRegisterValidator({
      ...validPayload,
      email: 'invalid-email',
    });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Please enter a valid email address.',
    );
  });

  it('should fail with missing phone', () => {
    const result = candidateRegisterValidator({ ...validPayload, phone: '' });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Phone number cannot be empty.',
    );
  });

  it('should fail with invalid phone', () => {
    const result = candidateRegisterValidator({
      ...validPayload,
      phone: '0712345678',
    });

    expect(result).toBeDefined();
    expect(result?.details.map(d => d.message)).toContain(
      'Please enter a valid phone number with country code.',
    );
  });
});
