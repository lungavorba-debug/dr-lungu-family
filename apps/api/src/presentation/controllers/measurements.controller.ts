import type { Request, Response, NextFunction } from 'express';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  getPreviousMeasurementsUseCase,
  saveMeasurementsUseCase,
} from '../../infrastructure/container';

export async function getPreviousMeasurementsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const patientId = Array.isArray(req.params.patientId)
      ? req.params.patientId[0]
      : req.params.patientId;

    const data = await getPreviousMeasurementsUseCase.execute(patientId);
    sendSuccess(res, data, 'Măsurătorile anterioare au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function saveMeasurementsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const data = await saveMeasurementsUseCase.execute(req.body, req.user.id);

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.SCREENING_STARTED,
      entity_type: AUDIT_ENTITY_TYPES.SCREENING,
      entity_id: data.screening_id,
      description: 'Screening nou inițiat cu salvarea măsurătorilor.',
    });

    sendSuccess(res, data, 'Măsurătorile au fost salvate.', 201);
  } catch (error) {
    next(error);
  }
}
