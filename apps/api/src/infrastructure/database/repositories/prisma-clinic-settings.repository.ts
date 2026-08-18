import { Prisma } from '@prisma/client';
import type {
  AiSettings,
  ApplicationSettings,
  BrandingSettings,
  ClinicInfoSettings,
  ClinicSettingsRecord,
  ContactSettings,
  FooterSettings,
  LogoSettings,
  PdfSettings,
  QrSettings,
  SmtpSettings,
  WhatsAppSettings,
} from '@medscreen/types';
import { DEFAULT_CLINIC_SETTINGS_ID } from '@medscreen/shared';
import type {
  ClinicSettingsDbRecord,
  ClinicSettingsRepository,
} from '../../../domain/repositories/clinic-settings.repository';
import { mapDbRecordToSettings, mapSettingsToDbColumns } from '../../../domain/repositories/clinic-settings.repository';
import { prisma } from '../prisma.client';

function mapRecord(record: {
  id: string;
  clinicInfo: unknown;
  branding: unknown;
  contact: unknown;
  logo: unknown;
  footer: unknown;
  pdf: unknown;
  qr: unknown;
  smtp: unknown;
  whatsapp: unknown;
  ai: unknown;
  application: unknown;
  updatedAt: Date;
  updatedById: string | null;
  updatedByName: string | null;
}): ClinicSettingsDbRecord {
  return {
    id: record.id,
    clinicInfo: record.clinicInfo as ClinicInfoSettings,
    branding: record.branding as BrandingSettings,
    contact: record.contact as ContactSettings,
    logo: record.logo as LogoSettings,
    footer: record.footer as FooterSettings,
    pdf: record.pdf as PdfSettings,
    qr: record.qr as QrSettings,
    smtp: record.smtp as SmtpSettings,
    whatsapp: record.whatsapp as WhatsAppSettings,
    ai: record.ai as AiSettings,
    application: record.application as ApplicationSettings,
    updatedAt: record.updatedAt,
    updatedById: record.updatedById,
    updatedByName: record.updatedByName,
  };
}

function toDbJsonColumns(settings: ClinicSettingsRecord) {
  const columns = mapSettingsToDbColumns(settings);
  return {
    clinicInfo: columns.clinicInfo as unknown as Prisma.InputJsonValue,
    branding: columns.branding as unknown as Prisma.InputJsonValue,
    contact: columns.contact as unknown as Prisma.InputJsonValue,
    logo: columns.logo as unknown as Prisma.InputJsonValue,
    footer: columns.footer as unknown as Prisma.InputJsonValue,
    pdf: columns.pdf as unknown as Prisma.InputJsonValue,
    qr: columns.qr as unknown as Prisma.InputJsonValue,
    smtp: columns.smtp as unknown as Prisma.InputJsonValue,
    whatsapp: columns.whatsapp as unknown as Prisma.InputJsonValue,
    ai: columns.ai as unknown as Prisma.InputJsonValue,
    application: columns.application as unknown as Prisma.InputJsonValue,
  };
}

export class PrismaClinicSettingsRepository implements ClinicSettingsRepository {
  async get(): Promise<ClinicSettingsDbRecord | null> {
    const record = await prisma.clinicSettings.findUnique({ where: { id: DEFAULT_CLINIC_SETTINGS_ID } });
    return record ? mapRecord(record) : null;
  }

  async upsert(
    settings: ClinicSettingsRecord,
    changedBy?: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord> {
    const record = await prisma.clinicSettings.upsert({
      where: { id: DEFAULT_CLINIC_SETTINGS_ID },
      update: {
        ...toDbJsonColumns(settings),
        ...(changedBy
          ? { updatedById: changedBy.id, updatedByName: changedBy.name }
          : {}),
      },
      create: {
        id: DEFAULT_CLINIC_SETTINGS_ID,
        ...toDbJsonColumns(settings),
        ...(changedBy
          ? { updatedById: changedBy.id, updatedByName: changedBy.name }
          : {}),
      },
    });
    return mapRecord(record);
  }

  async updateSection(
    section: keyof ClinicSettingsRecord,
    data: ClinicSettingsRecord[keyof ClinicSettingsRecord],
    changedBy: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord> {
    const columnMap: Record<keyof ClinicSettingsRecord, keyof ReturnType<typeof mapSettingsToDbColumns>> = {
      clinic: 'clinicInfo',
      branding: 'branding',
      contact: 'contact',
      logo: 'logo',
      footer: 'footer',
      pdf: 'pdf',
      qr: 'qr',
      smtp: 'smtp',
      whatsapp: 'whatsapp',
      ai: 'ai',
      application: 'application',
    };

    const column = columnMap[section];
    const record = await prisma.clinicSettings.update({
      where: { id: DEFAULT_CLINIC_SETTINGS_ID },
      data: {
        [column]: data as unknown as Prisma.InputJsonValue,
        updatedById: changedBy.id,
        updatedByName: changedBy.name,
      },
    });
    return mapRecord(record);
  }
}

export { mapDbRecordToSettings, mapSettingsToDbColumns };
