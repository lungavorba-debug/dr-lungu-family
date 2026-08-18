import type { Request, Response, NextFunction } from 'express';
import { exportScreeningsQuerySchema } from '@medscreen/shared';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  exportScreeningsExcelUseCase,
  getExportScreeningsMetadataUseCase,
} from '../../infrastructure/container';

function parseExportQuery(req: Request) {
  const parsed = exportScreeningsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
      field: issue.path.join('.') || 'query',
      issue: issue.message,
    }));
    throw new AppError(400, 'INVALID_PARAMETER', 'Parametri de export invalizi.', details);
  }
  return parsed.data;
}

export async function getExportScreeningsMetadataController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const query = parseExportQuery(req);
    const metadata = await getExportScreeningsMetadataUseCase.execute(query.campaign_id);
    sendSuccess(res, metadata, 'Metadatele exportului au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function exportScreeningsExcelController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const query = parseExportQuery(req);
    const result = await exportScreeningsExcelUseCase.execute({
      campaignId: query.campaign_id,
      from: query.from,
      to: query.to,
      campaignDay: query.campaign_day,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.EXPORT_GENERATED,
      entity_type: AUDIT_ENTITY_TYPES.EXPORT,
      entity_id: query.campaign_id,
      description: `Export Excel generat cu ${result.rowCount} screeninguri finalizate.`,
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('X-Export-Row-Count', String(result.rowCount));
    res.status(200).send(result.xlsx);
  } catch (error) {
    next(error);
  }
}
