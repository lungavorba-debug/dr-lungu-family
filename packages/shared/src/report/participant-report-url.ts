import type { ClinicSettingsSnapshot } from '@medscreen/types';

import { resolveClinicQrUrl } from '../clinic/qr-code-generator';
import { resolveClinicSettingsSnapshot } from '../clinic/resolve-clinic-settings';

export interface ParticipantReportUrlSource {
  metadata: {
    report_id: string;
    report_number: string;
  };
}

const FALLBACK_REPORT_BASE_URL = 'https://www.drlungufamily.ro';

function normalizePublicBaseUrl(website: string): string {
  const trimmed = website.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  return withProtocol.replace(/\/+$/, '');
}

function resolveReportBaseUrl(settings: ClinicSettingsSnapshot): string {
  const website = settings.contact.website?.trim();
  if (website) {
    return normalizePublicBaseUrl(website);
  }

  return resolveClinicQrUrl({
    website: FALLBACK_REPORT_BASE_URL,
  });
}

/** Canonical participant report URL — used by QR, WhatsApp, and email sharing. */
export function buildParticipantReportUrl(
  report: ParticipantReportUrlSource,
  clinicSettings?: ClinicSettingsSnapshot | null,
): string {
  const settings = resolveClinicSettingsSnapshot(clinicSettings);
  const baseUrl = resolveReportBaseUrl(settings);
  const reportId = report.metadata?.report_id?.trim();
  const reportNumber = report.metadata?.report_number?.trim();

  if (!reportId || !reportNumber) {
    return baseUrl;
  }

  try {
    const url = new URL(`raport/${encodeURIComponent(reportId)}`, `${baseUrl}/`);
    url.searchParams.set('nr', reportNumber);
    return url.toString();
  } catch {
    return baseUrl;
  }
}
