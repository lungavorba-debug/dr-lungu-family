import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { generateScreeningReportPdfUseCase } from '../../infrastructure/container';

export async function generateParticipantReportPdfController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await generateScreeningReportPdfUseCase.execute(req.body);
    sendSuccess(res, result, 'PDF-ul raportului participant a fost generat.');
  } catch (error) {
    if (!(error instanceof AppError)) {
      console.error('[pdf] Unhandled controller error:', error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }
    }
    next(error);
  }
}
