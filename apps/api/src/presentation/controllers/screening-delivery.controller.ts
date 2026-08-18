import type { Request, Response, NextFunction } from 'express';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  deliverScreeningEmailUseCase,
  deliverScreeningWhatsAppUseCase,
  getDeliveryAvailabilityUseCase,
  listScreeningDeliveriesUseCase,
} from '../../infrastructure/container';

function readScreeningId(req: Request): string {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  if (!id) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Identificator screening invalid.');
  }
  return id;
}

export async function getDeliveryAvailabilityController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const screeningId = readScreeningId(req);
    const availability = await getDeliveryAvailabilityUseCase.execute(screeningId);
    sendSuccess(res, availability, 'Canalele de livrare au fost verificate.');
  } catch (error) {
    next(error);
  }
}

export async function listScreeningDeliveriesController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const screeningId = readScreeningId(req);
    const deliveries = await listScreeningDeliveriesUseCase.execute(screeningId);
    sendSuccess(res, deliveries, 'Istoricul livrărilor a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function deliverScreeningEmailController(
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
    const result = await deliverScreeningEmailUseCase.execute({
      screeningId,
      operatorId: req.user.id,
      email: req.body.email,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.REPORT_DELIVERED,
      entity_type: AUDIT_ENTITY_TYPES.REPORT,
      entity_id: screeningId,
      description: `Raport livrat prin email către ${result.recipient}.`,
    });

    sendSuccess(res, result, 'Raportul a fost trimis prin email.', 201);
  } catch (error) {
    next(error);
  }
}

export async function deliverScreeningWhatsAppController(
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
    const result = await deliverScreeningWhatsAppUseCase.execute({
      screeningId,
      operatorId: req.user.id,
      phone: req.body.phone,
    });

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.REPORT_DELIVERED,
      entity_type: AUDIT_ENTITY_TYPES.REPORT,
      entity_id: screeningId,
      description: `Raport livrat prin WhatsApp către ${result.recipient}.`,
    });

    sendSuccess(res, result, 'Raportul a fost trimis prin WhatsApp.', 201);
  } catch (error) {
    next(error);
  }
}
