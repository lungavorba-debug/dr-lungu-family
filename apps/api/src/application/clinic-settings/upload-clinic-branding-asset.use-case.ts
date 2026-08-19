import type { LogoSettings, UploadBrandingAssetRequest } from '@medscreen/types';
import {
  allowedBrandingMimes,
  brandingAssetApiPath,
  brandingAssetMaxBytes,
  cloneDefaultClinicSettings,
  decodeBrandingAssetBase64,
} from '@medscreen/shared';
import type { ClinicSettingsRepository } from '../../domain/repositories/clinic-settings.repository';
import { mapDbRecordToSettings } from '../../domain/repositories/clinic-settings.repository';
import type { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';
import type { ClinicBrandingStorageService } from '../../infrastructure/storage/clinic-branding-storage.service';
import { AppError } from '../../lib/app-error';

export class UploadClinicBrandingAssetUseCase {
  constructor(
    private readonly repository: ClinicSettingsRepository,
    private readonly resolver: ClinicSettingsResolver,
    private readonly storage: ClinicBrandingStorageService,
  ) {}

  async execute(
    payload: UploadBrandingAssetRequest,
    changedBy: { id: string; name: string },
  ): Promise<LogoSettings> {
    const allowedMimes = allowedBrandingMimes(payload.kind);
    if (!allowedMimes.includes(payload.mime)) {
      throw new AppError(
        400,
        'INVALID_PARAMETER',
        `Tipul de fișier ${payload.mime} nu este permis pentru ${payload.kind}.`,
      );
    }

    let bytes: Buffer;
    try {
      bytes = decodeBrandingAssetBase64(payload.file_base64);
    } catch {
      throw new AppError(400, 'INVALID_PARAMETER', 'Fișierul încărcat nu este valid.');
    }

    const maxBytes = brandingAssetMaxBytes(payload.kind);
    if (bytes.length === 0 || bytes.length > maxBytes) {
      throw new AppError(
        400,
        'INVALID_PARAMETER',
        `Fișierul depășește limita de ${Math.round(maxBytes / 1024)} KB.`,
      );
    }

    await this.storage.saveAsset(payload.kind, payload.mime, bytes);

    const currentRecord = await this.repository.get();
    const current = currentRecord
      ? mapDbRecordToSettings(currentRecord)
      : cloneDefaultClinicSettings();

    if (!currentRecord) {
      await this.repository.upsert(current);
    }

    const apiPath = brandingAssetApiPath(payload.kind);
    const nextLogo: LogoSettings =
      payload.kind === 'logo'
        ? {
            ...current.logo,
            logo_path: apiPath,
            logo_mime: payload.mime,
          }
        : payload.kind === 'favicon'
          ? {
              ...current.logo,
              favicon_path: apiPath,
              favicon_mime: payload.mime,
            }
          : {
              ...current.logo,
              report_qr_path: apiPath,
              report_qr_mime: payload.mime,
            };

    await this.repository.updateSection('logo', nextLogo, changedBy);
    this.resolver.invalidateCache();
    return nextLogo;
  }
}
