import type { Request, Response, NextFunction } from 'express';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  changePasswordUseCase,
  forgotPasswordUseCase,
  invalidateSessionUseCase,
  resetPasswordWithTokenUseCase,
} from '../../infrastructure/container';
import { getRequestAuditContext } from '../../infrastructure/audit/audit-recorder';

export async function changePasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await changePasswordUseCase.execute(req.user.id, req.body);

    auditRecorder.recordFromRequest(req, req.user, {
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: req.user.id,
      description: 'Parola contului a fost schimbată.',
    });

    sendSuccess(res, result, 'Parola a fost schimbată.');
  } catch (error) {
    next(error);
  }
}

export async function forgotPasswordController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await forgotPasswordUseCase.execute(req.body);
    sendSuccess(
      res,
      result,
      'Dacă adresa de email există în sistem, veți primi instrucțiuni de resetare.',
    );
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWithTokenController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await resetPasswordWithTokenUseCase.execute(req.body);

    auditRecorder.record({
      user_id: result.user.id,
      user_name: `${result.user.firstName} ${result.user.lastName}`,
      role: result.user.role,
      action: AUDIT_ACTIONS.PASSWORD_CHANGED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: result.user.id,
      description: 'Parola contului a fost resetată prin link de recuperare.',
      ...getRequestAuditContext(req),
    });

    sendSuccess(res, { success: result.success }, 'Parola a fost resetată. Vă puteți autentifica.');
  } catch (error) {
    next(error);
  }
}

export async function invalidateSessionController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    await invalidateSessionUseCase.execute(req.user.id);
    sendSuccess(res, { success: true }, 'Sesiunea a fost invalidată.');
  } catch (error) {
    next(error);
  }
}
