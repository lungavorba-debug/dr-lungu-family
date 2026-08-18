import type { Request, Response, NextFunction } from 'express';
import { updateClinicSettingsSchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  getClinicSettingsUseCase,
  getPublicClinicSettingsUseCase,
  updateClinicSettingsSectionUseCase,
} from '../../infrastructure/container';

function readChangedBy(req: Request): { id: string; name: string } {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');
  }
  return {
    id: req.user.id,
    name: `${req.user.firstName} ${req.user.lastName}`.trim(),
  };
}

export async function getPublicClinicSettingsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getPublicClinicSettingsUseCase.execute();
    sendSuccess(res, result, 'Setările publice ale clinicii au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function getClinicSettingsController(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const result = await getClinicSettingsUseCase.execute();
    sendSuccess(res, result, 'Setările clinicii au fost încărcate.');
  } catch (error) {
    next(error);
  }
}

export async function updateClinicSettingsController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = updateClinicSettingsSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue) => ({
        field: issue.path.join('.') || 'body',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Date de setări invalide.', details));
      return;
    }

    const result = await updateClinicSettingsSectionUseCase.execute(parsed.data, readChangedBy(req));
    sendSuccess(res, result, 'Secțiunea de setări a fost actualizată.');
  } catch (error) {
    next(error);
  }
}
