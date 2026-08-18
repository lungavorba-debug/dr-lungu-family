import {
  formatPhoneDisplay,
  type ParticipantReport,
} from '@medscreen/shared';
import type { ClinicSettingsRecord } from '@medscreen/types';

function asParticipantReport(value: unknown): ParticipantReport | null {
  if (!value || typeof value !== 'object') return null;

  const report = value as Partial<ParticipantReport>;
  if (!report.metadata?.report_id || !report.metadata.report_number) {
    return null;
  }

  return report as ParticipantReport;
}

function resolveEventDisplayName(report: ParticipantReport | null, fallback?: string): string {
  if (report?.event.festival_name) {
    const edition = report.event.edition?.trim();
    return edition ? `${report.event.festival_name} - ${edition}` : report.event.festival_name;
  }

  return fallback?.trim() || 'Screening Cardiovascular';
}

/** Clinic-branded WhatsApp document caption for whatsapp-web.js PDF delivery. */
export function buildDeliveryWhatsAppCaption(
  participantReport: unknown,
  participantName: string,
  clinicSettings: ClinicSettingsRecord,
  campaignName?: string,
): string {
  const report = asParticipantReport(participantReport);
  const greetingName = report?.participant.display_name ?? participantName;
  const eventName = resolveEventDisplayName(report, campaignName);

  const clinicName = report?.clinic.name ?? clinicSettings.clinic.name;
  const clinicAddress = report?.clinic.address ?? clinicSettings.contact.address;
  const clinicPhone = formatPhoneDisplay(report?.clinic.phone ?? clinicSettings.contact.phone);

  const lines = [
    `Bună ziua, ${greetingName}!`,
    '',
    `Vă mulțumim pentru participarea la Campania de Screening ${eventName}.`,
    '',
    'Raportul PDF este atașat acestui mesaj.',
    '',
    `Programări: ${clinicPhone}`,
    `📍 ${clinicName}, ${clinicAddress}`,
    '',
    'Echipa Dr. Lungu Family',
  ];

  return lines.join('\n').slice(0, 1024);
}

export function resolveWhatsAppEventDisplayName(
  participantReport: unknown,
  campaignName?: string,
): string {
  return resolveEventDisplayName(asParticipantReport(participantReport), campaignName);
}
