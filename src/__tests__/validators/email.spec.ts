import { emailValidator } from '@work-whiz/validators/email.validator';

describe('emailValidator', () => {
  it('should return undefined for a valid email', () => {
    const error = emailValidator('user@example.com');
    expect(error).toBeUndefined();
  });

  it('should return error for an empty string', () => {
    const error = emailValidator('');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Email cannot be just spaces or empty.'
    );
  });

  it('should return error for a whitespace-only string', () => {
    const error = emailValidator('   ');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Email cannot be just spaces or empty.'
    );
  });

  it('should return error for an invalid format', () => {
    const error = emailValidator('not-an-email');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid email address.'
    );
  });

  it('should return error for a blocked domain (protonmail.com)', () => {
    const error = emailValidator('user@protonmail.com');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'We currently do not accept emails from that provider.'
    );
  });

  it('should return error for a blocked domain (tutanota.io)', () => {
    const error = emailValidator('someone@tutanota.io');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'We currently do not accept emails from that provider.'
    );
  });

  it('should return undefined for a non-blocked, well-formed email', () => {
    const error = emailValidator('john.doe@gmail.com');
    expect(error).toBeUndefined();
  });
});
