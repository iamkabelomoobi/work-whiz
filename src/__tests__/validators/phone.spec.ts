import { phoneValidator } from '@work-whiz/validators/phone.validator';

describe('phoneValidator', () => {
  it('should return undefined for a valid phone number with country code', () => {
    const error = phoneValidator('+1234567890123');
    expect(error).toBeUndefined();
  });

  it('should return error for missing plus sign', () => {
    const error = phoneValidator('1234567890');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should return error for letters in the phone number', () => {
    const error = phoneValidator('+123ABC7890');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should return error for too short number', () => {
    const error = phoneValidator('+123456');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should return error for too long number', () => {
    const error = phoneValidator('+12345678901234567890');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should return error for empty string', () => {
    const error = phoneValidator('');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe('Phone number cannot be empty.');
  });

  it('should return error for only plus sign', () => {
    const error = phoneValidator('+');
    expect(error).toBeDefined();
    expect(error?.details[0].message).toBe(
      'Please enter a valid phone number with country code.',
    );
  });

  it('should return error if input is null/undefined', () => {
    const error1 = phoneValidator(null as unknown as string);
    const error2 = phoneValidator(undefined as unknown as string);

    expect(error1).toBeDefined();
    expect(error2).toBeDefined();
    expect(error1?.details[0].message).toBe('Phone number is required.');
    expect(error2?.details[0].message).toBe('Phone number is required.');
  });
});
