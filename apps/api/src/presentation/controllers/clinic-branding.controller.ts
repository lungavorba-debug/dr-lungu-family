import type { Request, Response, NextFunction } from 'express';
import { uploadBrandingAssetSchema } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { sendSuccess } from '../../lib/api-response';
import {
  clinicSettingsResolverInstance,
  uploadClinicBrandingAssetUseCase,
} from '../../infrastructure/container';
import { clinicBrandingStorageService } from '../../infrastructure/storage/clinic-branding-storage.service';

function readChangedBy(req: Request): { id: string; name: string } {
  if (!req.user) {
    throw new AppError(401, 'UNAUTHORIZED', 'Token JWT lipsă sau expirat.');
  }
  return {
    id: req.user.id,
    name: `${req.user.firstName} ${req.user.lastName}`.trim(),
  };
}

export async function uploadClinicBrandingAssetController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = uploadBrandingAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      const details = parsed.error.errors.map((issue: { path: (string | number)[]; message: string }) => ({
        field: issue.path.join('.') || 'body',
        issue: issue.message,
      }));
      next(new AppError(400, 'INVALID_PARAMETER', 'Date de upload invalide.', details));
      return;
    }

    const logo = await uploadClinicBrandingAssetUseCase.execute(parsed.data, readChangedBy(req));
    sendSuccess(res, { logo }, 'Asset-ul de branding a fost încărcat.');
  } catch (error) {
    next(error);
  }
}

export async function getClinicBrandingAssetController(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const kind = req.params.kind;
    if (kind !== 'logo' && kind !== 'favicon') {
      next(new AppError(404, 'NOT_FOUND', 'Asset-ul solicitat nu există.'));
      return;
    }

    const settings = await clinicSettingsResolverInstance.getSettings();
    const mime = kind === 'logo' ? settings.logo.logo_mime : settings.logo.favicon_mime;
    const bytes = await clinicBrandingStorageService.readAsset(kind, mime);

    if (!bytes) {
      next(new AppError(404, 'NOT_FOUND', 'Asset-ul solicitat nu există.'));
      return;
    }

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.status(200).send(bytes);
  } catch (error) {
    next(error);
  }
}
