/* eslint-disable @typescript-eslint/no-explicit-any */
import { employerValidator } from '@work-whiz/validators';

describe('employerValidator', () => {
  it('should return undefined for valid employer data', () => {
    const employer = {
      name: 'Tech Corp',
      industry: 'Technology',
      websiteUrl: 'https://techcorp.com',
      location: 'San Francisco',
      description: 'A tech company',
      size: 100,
      foundedIn: 2000,
    };

    const result = employerValidator(employer);
    expect(result).toBeUndefined();
  });

  it('should return undefined when all fields are omitted (all optional)', () => {
    const result = employerValidator({});
    expect(result).toBeUndefined();
  });

  it('should return error for invalid website URL', () => {
    const result = employerValidator({ websiteUrl: 'invalid-url' });
    expect(result?.details[0].message).toBe('Website URL must be a valid URL');
  });

  it('should return error for non-string name', () => {
    const result = employerValidator({ name: 123 as any });
    expect(result?.details[0].message).toBe('Company name should be a string');
  });

  it('should return error for non-integer size', () => {
    const result = employerValidator({ size: 10.5 });
    expect(result?.details[0].message).toBe('Size should be an integer');
  });

  it('should return error if foundedIn is too old', () => {
    const result = employerValidator({ foundedIn: 1700 });
    expect(result?.details[0].message).toBe(
      'Founded year should be at least 1800',
    );
  });

  it('should return error if foundedIn is in the future', () => {
    const nextYear = new Date().getFullYear() + 1;
    const result = employerValidator({ foundedIn: nextYear });
    expect(result?.details[0].message).toBe(
      'Founded year cannot be in the future',
    );
  });

  it('should return multiple errors if multiple fields are invalid', () => {
    const result = employerValidator({
      websiteUrl: 'bad-url',
      size: 'big' as any,
      foundedIn: 'now' as any,
    });

    const messages = result?.details.map(d => d.message);
    expect(messages).toContain('Website URL must be a valid URL');
    expect(messages).toContain('Size should be a number');
    expect(messages).toContain('Founded year should be a number');
  });
});
