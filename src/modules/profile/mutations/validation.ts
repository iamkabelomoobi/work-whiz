const validationMessage = (error: unknown): string =>
  typeof error === 'object' &&
  error !== null &&
  'details' in error &&
  Array.isArray((error as { details?: Array<{ message?: string }> }).details)
    ? (error as { details: Array<{ message?: string }> }).details[0]?.message ||
      'Invalid input'
    : 'Invalid input';

export const assertValid = (error: unknown): void => {
  if (error) {
    throw new Error(validationMessage(error));
  }
};
