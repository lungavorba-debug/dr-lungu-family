import type {
  ClinicSettingsRecord,
  ClinicSettingsSnapshot,
  PublicClinicSettings,
} from '@medscreen/types';
import { generateQrMatrix, resolveClinicQrUrl } from './qr-code-generator';
import { cloneDefaultClinicSettings } from './default-clinic-settings';

export function toClinicSettingsSnapshot(settings: ClinicSettingsRecord): ClinicSettingsSnapshot {
  return {
    clinic: settings.clinic,
    contact: settings.contact,
    footer: settings.footer,
    pdf: settings.pdf,
    qr: settings.qr,
    logo: settings.logo,
  };
}

export function toPublicClinicSettings(settings: ClinicSettingsRecord): PublicClinicSettings {
  return {
    clinic: settings.clinic,
    branding: settings.branding,
    contact: settings.contact,
    logo: settings.logo,
    footer: settings.footer,
    pdf: settings.pdf,
    qr: settings.qr,
    application: {
      default_locale: settings.application.default_locale,
      support_email: settings.application.support_email,
      delivery_signature: settings.application.delivery_signature,
    },
  };
}

export function resolveQrUrlFromSettings(settings: ClinicSettingsSnapshot): string {
  if (settings.qr.preferred_url === 'custom' && settings.qr.custom_url) {
    return settings.qr.custom_url;
  }

  return resolveClinicQrUrl({
    website: settings.qr.preferred_url === 'website' ? settings.contact.website : undefined,
    googleBusinessUrl:
      settings.qr.preferred_url === 'google_business' ? settings.contact.google_business_url : undefined,
    contactPageUrl:
      settings.qr.preferred_url === 'contact_page' ? settings.contact.contact_page_url : undefined,
  });
}

export function resolveClinicSettingsSnapshot(
  settings?: ClinicSettingsSnapshot | null,
): ClinicSettingsSnapshot {
  if (!settings) {
    return toClinicSettingsSnapshot(cloneDefaultClinicSettings());
  }
  return settings;
}

export function buildQrMatrixFromSettings(settings: ClinicSettingsSnapshot): boolean[][] {
  return generateQrMatrix(resolveQrUrlFromSettings(settings));
}

export const SECRET_MASK = '********';

export function maskSecret(value: string): string {
  return value.trim() ? SECRET_MASK : '';
}

export function mergeSecretField(currentValue: string, incomingValue: string): string {
  if (!incomingValue.trim() || incomingValue === SECRET_MASK) {
    return currentValue;
  }
  return incomingValue;
}
