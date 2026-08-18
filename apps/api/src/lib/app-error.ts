export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly details?: { field: string; issue: string }[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}
