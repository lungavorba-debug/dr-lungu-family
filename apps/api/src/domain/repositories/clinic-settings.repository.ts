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
import { cloneDefaultClinicSettings, normalizeAiSettings } from '@medscreen/shared';

export interface ClinicSettingsDbRecord {
  id: string;
  clinicInfo: ClinicInfoSettings;
  branding: BrandingSettings;
  contact: ContactSettings;
  logo: LogoSettings;
  footer: FooterSettings;
  pdf: PdfSettings;
  qr: QrSettings;
  smtp: SmtpSettings;
  whatsapp: WhatsAppSettings;
  ai: AiSettings;
  application: ApplicationSettings;
  updatedAt: Date;
  updatedById: string | null;
  updatedByName: string | null;
}

export interface ClinicSettingsRepository {
  get(): Promise<ClinicSettingsDbRecord | null>;
  upsert(
    settings: ClinicSettingsRecord,
    changedBy?: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord>;
  updateSection(
    section: keyof ClinicSettingsRecord,
    data: ClinicSettingsRecord[keyof ClinicSettingsRecord],
    changedBy: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord>;
}

export function mapDbRecordToSettings(record: ClinicSettingsDbRecord): ClinicSettingsRecord {
  const defaults = cloneDefaultClinicSettings();
  return {
    clinic: { ...defaults.clinic, ...record.clinicInfo },
    branding: { ...defaults.branding, ...record.branding },
    contact: { ...defaults.contact, ...record.contact },
    logo: { ...defaults.logo, ...record.logo },
    footer: { ...defaults.footer, ...record.footer },
    pdf: { ...defaults.pdf, ...record.pdf },
    qr: { ...defaults.qr, ...record.qr },
    smtp: { ...defaults.smtp, ...record.smtp },
    whatsapp: { ...defaults.whatsapp, ...record.whatsapp },
    ai: normalizeAiSettings({ ...defaults.ai, ...record.ai }),
    application: { ...defaults.application, ...record.application },
  };
}

export function mapSettingsToDbColumns(settings: ClinicSettingsRecord) {
  return {
    clinicInfo: settings.clinic,
    branding: settings.branding,
    contact: settings.contact,
    logo: settings.logo,
    footer: settings.footer,
    pdf: settings.pdf,
    qr: settings.qr,
    smtp: settings.smtp,
    whatsapp: settings.whatsapp,
    ai: settings.ai,
    application: settings.application,
  };
}
