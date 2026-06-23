/** Operational error with an HTTP status + machine-readable code. */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const BadRequest = (message = 'Bad request') => new AppError(400, 'BAD_REQUEST', message);
export const Unauthorized = (message = 'Unauthorized') =>
  new AppError(401, 'UNAUTHORIZED', message);
export const NotFound = (message = 'Not found') => new AppError(404, 'NOT_FOUND', message);
export const Conflict = (message = 'Conflict') => new AppError(409, 'CONFLICT', message);
