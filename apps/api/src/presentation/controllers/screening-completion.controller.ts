import type { Request, Response, NextFunction } from 'express';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  completeScreeningUseCase,
  getScreeningPdfUseCase,
  getScreeningReportUseCase,
} from '../../infrastructure/container';

function readScreeningId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator screening invalid.');
  }
  return id;
}

export async function completeScreeningController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const screeningId = readScreeningId(req);

    const result = await completeScreeningUseCase.execute({
      screeningId,
      operatorId: req.user.id,
      payload: req.body,
    });

    if (!result.already_completed) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.SCREENING_COMPLETED,
        entity_type: AUDIT_ENTITY_TYPES.SCREENING,
        entity_id: result.screening_id,
        description: 'Screening finalizat cu succes.',
      });
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.REPORT_GENERATED,
        entity_type: AUDIT_ENTITY_TYPES.REPORT,
        entity_id: result.screening_id,
        description: `Raport PDF generat: ${result.pdf_filename}.`,
      });
    }

    sendSuccess(
      res,
      result,
      result.already_completed
        ? 'Screeningul era deja finalizat.'
        : 'Screeningul a fost finalizat cu succes.',
      result.already_completed ? 200 : 201,
    );
  } catch (error) {
    next(error);
  }
}

export async function getScreeningReportController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const screeningId = readScreeningId(req);
    const report = await getScreeningReportUseCase.execute(screeningId);
    sendSuccess(res, report, 'Raportul participant a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function getScreeningPdfController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const screeningId = readScreeningId(req);
    const pdf = await getScreeningPdfUseCase.execute(screeningId);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.REPORT_DOWNLOADED,
        entity_type: AUDIT_ENTITY_TYPES.REPORT,
        entity_id: screeningId,
        description: `Raport PDF descărcat: ${pdf.filename}.`,
      });
    }

    res.setHeader('Content-Type', pdf.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.filename}"`);
    res.status(200).send(pdf.bytes);
  } catch (error) {
    next(error);
  }
}

export async function getScreeningPdfMetadataController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const screeningId = readScreeningId(req);
    const pdf = await getScreeningPdfUseCase.execute(screeningId);
    sendSuccess(res, pdf.metadata, 'Metadatele PDF au fost încărcate.');
  } catch (error) {
    next(error);
  }
}
