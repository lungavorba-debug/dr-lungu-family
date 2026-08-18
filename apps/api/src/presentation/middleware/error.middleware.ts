import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../lib/app-error';
import { sendError } from '../../lib/api-response';

export function notFoundMiddleware(_req: Request, res: Response): void {
  sendError(res, 404, 'NOT_FOUND', 'Resursa solicitată nu a fost găsită.');
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.errorCode, err.message, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const details = err.errors.map((issue) => ({
      field: issue.path.join('.') || 'body',
      issue: issue.message,
    }));
    sendError(res, 400, 'INVALID_PARAMETER', 'Date invalide.', details);
    return;
  }

  console.error('[api:error]', err.message);
  sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'A apărut o eroare neașteptată.');
}
