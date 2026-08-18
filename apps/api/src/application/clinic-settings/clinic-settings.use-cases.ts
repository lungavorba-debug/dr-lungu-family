import type {
  ClinicSettingsRecord,
  ClinicSettingsResponse,
  PublicClinicSettingsResponse,
} from '@medscreen/types';
import type { UpdateClinicSettingsInput } from '@medscreen/shared';
import {
  cloneDefaultClinicSettings,
  maskSecret,
  toPublicClinicSettings,
} from '@medscreen/shared';
import type { ClinicSettingsRepository } from '../../domain/repositories/clinic-settings.repository';
import { mapDbRecordToSettings } from '../../domain/repositories/clinic-settings.repository';
import type { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';

function maskSecrets(settings: ClinicSettingsRecord): ClinicSettingsRecord {
  return {
    ...settings,
    smtp: {
      ...settings.smtp,
      pass: maskSecret(settings.smtp.pass),
    },
    whatsapp: {
      ...settings.whatsapp,
      access_token: maskSecret(settings.whatsapp.access_token),
    },
    ai: {
      ...settings.ai,
      api_key: maskSecret(settings.ai.api_key),
    },
  };
}

function toResponse(record: NonNullable<Awaited<ReturnType<ClinicSettingsRepository['get']>>>): ClinicSettingsResponse {
  return {
    ...maskSecrets(mapDbRecordToSettings(record)),
    meta: {
      updated_at: record.updatedAt.toISOString(),
      updated_by_id: record.updatedById,
      updated_by_name: record.updatedByName,
    },
  };
}

export class GetPublicClinicSettingsUseCase {
  constructor(
    private readonly repository: ClinicSettingsRepository,
    private readonly resolver: ClinicSettingsResolver,
  ) {}

  async execute(): Promise<PublicClinicSettingsResponse> {
    const settings = await this.resolver.getSettings();
    const record = await this.repository.get();
    return {
      settings: toPublicClinicSettings(settings),
      meta: {
        updated_at: record?.updatedAt.toISOString() ?? new Date().toISOString(),
        updated_by_id: record?.updatedById ?? null,
        updated_by_name: record?.updatedByName ?? null,
      },
    };
  }
}

export class GetClinicSettingsUseCase {
  constructor(
    private readonly repository: ClinicSettingsRepository,
    private readonly resolver: ClinicSettingsResolver,
  ) {}

  async execute(): Promise<ClinicSettingsResponse> {
    const record = await this.repository.get();
    if (!record) {
      const seeded = await this.repository.upsert(cloneDefaultClinicSettings());
      this.resolver.invalidateCache();
      return toResponse(seeded);
    }
    return toResponse(record);
  }
}

export class UpdateClinicSettingsSectionUseCase {
  constructor(
    private readonly repository: ClinicSettingsRepository,
    private readonly resolver: ClinicSettingsResolver,
  ) {}

  async execute(
    payload: UpdateClinicSettingsInput,
    changedBy: { id: string; name: string },
  ): Promise<ClinicSettingsResponse> {
    const currentRecord = await this.repository.get();
    const current = currentRecord
      ? mapDbRecordToSettings(currentRecord)
      : cloneDefaultClinicSettings();

    if (!currentRecord) {
      await this.repository.upsert(current);
    }

    const mergedData = this.resolver.mergeSectionSecrets(
      current,
      payload.section,
      payload.data as ClinicSettingsRecord[keyof ClinicSettingsRecord],
    );

    const updated = await this.repository.updateSection(
      payload.section,
      mergedData,
      changedBy,
    );
    this.resolver.invalidateCache();
    return toResponse(updated);
  }
}

export class EnsureClinicSettingsSeedUseCase {
  constructor(private readonly repository: ClinicSettingsRepository) {}

  async execute(): Promise<void> {
    const existing = await this.repository.get();
    if (!existing) {
      await this.repository.upsert(cloneDefaultClinicSettings());
    }
  }
}
