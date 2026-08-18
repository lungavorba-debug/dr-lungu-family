import type { Request, Response, NextFunction } from 'express';
import { listAuditLogsQuerySchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import { listAuditLogsUseCase } from '../../infrastructure/container';

export async function listAuditLogsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = listAuditLogsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
        field: issue.path.join('.') || 'query',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Parametri de căutare invalizi.', details));
      return;
    }

    const result = await listAuditLogsUseCase.execute({
      search: parsed.data.search,
      action: parsed.data.action,
      entityType: parsed.data.entity_type,
      entityId: parsed.data.entity_id,
      from: parsed.data.from,
      to: parsed.data.to,
      page: parsed.data.page,
      limit: parsed.data.limit,
    });

    sendSuccess(res, result, 'Jurnalul de audit a fost încărcat.');
  } catch (error) {
    next(error);
  }
}
