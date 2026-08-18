import type { Request, Response, NextFunction } from 'express';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  createInitialAdminUseCase,
  getSetupStatusUseCase,
} from '../../infrastructure/container';
import { getRequestAuditContext } from '../../infrastructure/audit/audit-recorder';

export async function getSetupStatusController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getSetupStatusUseCase.execute();
    sendSuccess(res, result, 'Starea configurării inițiale a fost încărcată.');
  } catch (error) {
    next(error);
  }
}

export async function createInitialAdminController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await createInitialAdminUseCase.execute(req.body);

    auditRecorder.record({
      user_id: result.user.id,
      user_name: `${result.user.firstName} ${result.user.lastName}`,
      role: result.user.role,
      action: AUDIT_ACTIONS.INITIAL_SETUP,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: result.user.id,
      description: 'Administrator inițial creat în configurarea platformei.',
      ...getRequestAuditContext(req),
    });

    sendSuccess(res, result, 'Administratorul inițial a fost creat.', 201);
  } catch (error) {
    next(error);
  }
}
