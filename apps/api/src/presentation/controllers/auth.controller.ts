import type { NextFunction, Request, Response } from 'express';
import type { LoginInput } from '@medscreen/shared';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { auditRecorder, invalidateSessionUseCase, loginUseCase } from '../../infrastructure/container';
import { getRequestAuditContext } from '../../infrastructure/audit/audit-recorder';
import { sendSuccess } from '../../lib/api-response';

export async function loginController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await loginUseCase.execute(req.body as LoginInput);

    auditRecorder.record({
      user_id: data.user.id,
      user_name: `${data.user.firstName} ${data.user.lastName}`,
      role: data.user.role,
      action: AUDIT_ACTIONS.LOGIN,
      entity_type: AUDIT_ENTITY_TYPES.SESSION,
      entity_id: data.user.id,
      description: 'Autentificare reușită.',
      ...getRequestAuditContext(req),
    });

    sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function logoutController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (req.user) {
      await invalidateSessionUseCase.execute(req.user.id);

      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.LOGOUT,
        entity_type: AUDIT_ENTITY_TYPES.SESSION,
        entity_id: req.user.id,
        description: 'Deconectare din sistem.',
      });
    }

    sendSuccess(res, { success: true }, 'Deconectare reușită.');
  } catch (error) {
    next(error);
  }
}
