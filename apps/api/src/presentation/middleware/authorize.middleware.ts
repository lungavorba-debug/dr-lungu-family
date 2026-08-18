import type { NextFunction, Request, Response } from 'express';
import type { RoleName } from '@medscreen/types';
import { AppError } from '../../lib/app-error';

export function authorize(...allowedRoles: RoleName[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Nu aveți permisiunea necesară pentru această acțiune.'));
      return;
    }

    next();
  };
}
