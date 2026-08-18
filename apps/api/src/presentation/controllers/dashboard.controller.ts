import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { listCriticalCasesQuerySchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { getDashboardStatsUseCase, listCriticalCasesUseCase } from '../../infrastructure/container';

const dashboardStatsQuerySchema = z.object({
  campaign_id: z.string().uuid('ID campanie invalid.'),
});

export async function getDashboardStatsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const parsed = dashboardStatsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(
        new AppError(400, 'INVALID_PARAMETER', 'Parametrul campaign_id este obligatoriu.', [
          { field: 'campaign_id', issue: 'Trebuie să fie un UUID valid.' },
        ]),
      );
      return;
    }

    const stats = await getDashboardStatsUseCase.execute({
      campaignId: parsed.data.campaign_id,
      operatorId: req.user.id,
    });

    if (!stats) {
      next(new AppError(404, 'NOT_FOUND', 'Campania solicitată nu a fost găsită.'));
      return;
    }

    sendSuccess(res, stats, 'Statisticile dashboard au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function listCriticalCasesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const parsed = listCriticalCasesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listCriticalCasesUseCase.execute({
      campaignId: parsed.data.campaign_id,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Lista cazurilor critice a fost încărcată.');
  } catch (error) {
    next(error);
  }
}
