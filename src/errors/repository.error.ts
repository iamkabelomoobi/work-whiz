export class RepositoryError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'RepositoryError';

    Object.setPrototypeOf(this, RepositoryError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RepositoryError);
    }
  }
}
