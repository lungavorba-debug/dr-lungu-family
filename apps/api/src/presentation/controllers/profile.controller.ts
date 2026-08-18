import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  auditRecorder,
  getUserProfileUseCase,
  unlockUserAccountUseCase,
  updateUserProfileUseCase,
} from '../../infrastructure/container';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';

export async function getMyProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await getUserProfileUseCase.execute(req.user.id);
    sendSuccess(res, result, 'Profilul a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfileController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.'));
      return;
    }

    const result = await updateUserProfileUseCase.execute(req.user.id, req.body);
    sendSuccess(res, result, 'Profilul a fost actualizat.');
  } catch (error) {
    next(error);
  }
}

export async function unlockUserController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (!id) {
      next(new AppError(400, 'INVALID_PARAMETER', 'Identificator utilizator invalid.'));
      return;
    }

    const result = await unlockUserAccountUseCase.execute(id);

    if (req.user) {
      auditRecorder.recordFromRequest(req, req.user, {
        action: AUDIT_ACTIONS.ACCOUNT_UNLOCKED,
        entity_type: AUDIT_ENTITY_TYPES.USER,
        entity_id: id,
        description: 'Contul utilizatorului a fost deblocat de administrator.',
      });
    }

    sendSuccess(res, result, 'Contul utilizatorului a fost deblocat.');
  } catch (error) {
    next(error);
  }
}
