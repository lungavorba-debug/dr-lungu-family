import type { Request, Response, NextFunction } from 'express';
import { listScreeningReportsQuerySchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { listScreeningReportsUseCase } from '../../infrastructure/container';

export async function listScreeningReportsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const parsed = listScreeningReportsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listScreeningReportsUseCase.execute({
      campaignId: parsed.data.campaign_id,
      patientId: parsed.data.patient_id,
      search: parsed.data.search,
      from: parsed.data.from,
      to: parsed.data.to,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Lista rapoartelor a fost încărcată.');
  } catch (error) {
    next(error);
  }
}
