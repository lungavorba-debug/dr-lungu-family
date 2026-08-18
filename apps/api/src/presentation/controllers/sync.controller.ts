import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { getScreeningSyncStatusUseCase } from '../../infrastructure/container';

function readScreeningId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator screening invalid.');
  }
  return id;
}

export async function getScreeningSyncStatusController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await getScreeningSyncStatusUseCase.execute({
      screeningId: readScreeningId(req),
      operatorId: req.user.id,
    });

    sendSuccess(res, result, 'Starea sincronizării screeningului a fost încărcată.');
  } catch (error) {
    next(error);
  }
}
