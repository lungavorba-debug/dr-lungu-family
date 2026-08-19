import {
  buildParticipantReportUrl,
  formatPhoneDisplay,
  toClinicSettingsSnapshot,
} from '@medscreen/shared';
import { isEmailOnlineReportEnabled } from '@medscreen/config';
import type { ClinicSettingsRecord } from '@medscreen/types';
import type { ParticipantReport } from '@medscreen/shared';

import {
  buildDeliveryEmailHtml,
  EMAIL_AUTO_FOOTER,
  EMAIL_MEDICAL_DISCLAIMER,
} from './build-delivery-email-html';

export const REPORT_EMAIL_SUBJECT = 'Raport medical – Screening Cardiovascular | Dr. Lungu Family';

const AVAILABLE_SPECIALTIES = [
  'Alergologie adulți și copii',
  'Cardiologie adulți',
  'Cardiologie pediatrică',
  'Endocrinologie adulți',
  'Endocrinologie pediatrică',
  'Gastroenterologie adulți',
  'Gastroenterologie pediatrică',
  'Pneumologie',
  'Nefrologie pediatrică',
] as const;

const COMING_SOON_SPECIALTIES = ['Dermatologie', 'Urologie', 'Ginecologie'] as const;

function asParticipantReport(value: unknown): ParticipantReport | null {
  if (!value || typeof value !== 'object') return null;

  const report = value as Partial<ParticipantReport>;
  if (!report.metadata?.report_id || !report.metadata.report_number) {
    return null;
  }

  return report as ParticipantReport;
}

function formatWebsiteLine(website: string | null | undefined): string | null {
  const trimmed = website?.trim();
  return trimmed ? trimmed : null;
}

function buildSpecialtyLines(items: readonly string[]): string[] {
  return items.map((item) => `• ${item}`);
}

function formatClinicHeading(clinicName: string): string {
  return clinicName.trim().toLowerCase().startsWith('clinica')
    ? clinicName.trim()
    : `Clinica ${clinicName.trim()}`;
}

export function buildDeliveryMessage(
  participantReport: unknown,
  participantName: string,
  clinicSettings: ClinicSettingsRecord,
): {
  subject: string;
  text: string;
  html: string;
  caption: string;
} {
  const report = asParticipantReport(participantReport);
  const settingsSnapshot = toClinicSettingsSnapshot(clinicSettings);
  const onlineReportEnabled = isEmailOnlineReportEnabled();
  const greetingName = report?.participant.display_name ?? participantName;
  const reportUrl = report
    ? buildParticipantReportUrl(report, settingsSnapshot)
    : null;

  const clinicName = report?.clinic.name ?? clinicSettings.clinic.name;
  const clinicAddress = report?.clinic.address ?? clinicSettings.contact.address;
  const clinicPhone = report?.clinic.phone ?? clinicSettings.contact.phone;
  const clinicWebsite = formatWebsiteLine(report?.clinic.website ?? clinicSettings.contact.website);
  const clinicHeading = formatClinicHeading(clinicName);

  const clinicLines = [
    clinicHeading,
    `📍 ${clinicAddress}`,
    `📞 ${formatPhoneDisplay(clinicPhone)}`,
    ...(clinicWebsite ? [`🌐 ${clinicWebsite}`] : []),
  ];

  const text = [
    `Bună ziua, ${greetingName}!`,
    '',
    'Vă mulțumim pentru participarea la Campania de Screening Cardiovascular.',
    '',
    ...(onlineReportEnabled
      ? ['Raportul dumneavoastră este disponibil aici:', reportUrl ?? '—', '']
      : []),
    'Raportul PDF este atașat acestui mesaj.',
    '',
    ...clinicLines,
    '',
    'Specialități disponibile',
    ...buildSpecialtyLines(AVAILABLE_SPECIALTIES),
    '',
    'În curând:',
    ...buildSpecialtyLines(COMING_SOON_SPECIALTIES),
    '',
    EMAIL_MEDICAL_DISCLAIMER,
    '',
    'Vă mulțumim pentru încrederea acordată!',
    '',
    'Echipa Dr. Lungu Family',
    '',
    EMAIL_AUTO_FOOTER,
  ].join('\n');

  const html = buildDeliveryEmailHtml({
    greetingName,
    reportUrl,
    onlineReportEnabled,
    clinicHeading,
    clinicAddress,
    clinicPhone: formatPhoneDisplay(clinicPhone),
    clinicWebsite,
    availableSpecialties: AVAILABLE_SPECIALTIES,
    comingSoonSpecialties: COMING_SOON_SPECIALTIES,
    consultationRecommendation: EMAIL_MEDICAL_DISCLAIMER,
  });

  return {
    subject: REPORT_EMAIL_SUBJECT,
    text,
    html,
    caption: REPORT_EMAIL_SUBJECT,
  };
}

export { EMAIL_AUTO_FOOTER, EMAIL_MEDICAL_DISCLAIMER };
