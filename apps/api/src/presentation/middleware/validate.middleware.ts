import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { ZodError } from 'zod';
import { AppError } from '../../lib/app-error';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((issue) => ({
          field: issue.path.join('.') || 'body',
          issue: issue.message,
        }));
        next(new AppError(400, 'INVALID_PARAMETER', 'Date invalide.', details));
        return;
      }
      next(error);
    }
  };
}
