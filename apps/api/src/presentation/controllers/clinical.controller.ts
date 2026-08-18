import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { evaluateClinicalEngineUseCase } from '../../infrastructure/container';

export async function evaluateClinicalEngineController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const evaluation = await evaluateClinicalEngineUseCase.execute(req.body);
    sendSuccess(res, { evaluation }, 'Evaluarea clinică a fost generată.');
  } catch (error) {
    next(error);
  }
}
