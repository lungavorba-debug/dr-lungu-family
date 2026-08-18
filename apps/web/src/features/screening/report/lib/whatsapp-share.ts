import type { ClinicSettingsSnapshot } from '@medscreen/types';
import {
  buildParticipantReportUrl,
  toWhatsAppPhoneNumber,
  type ParticipantReport,
} from '@medscreen/shared';

export interface WhatsAppReportShareMessageInput {
  participantName: string;
  secureReportUrl: string;
  clinicPhone?: string;
  clinicName?: string;
  clinicAddress?: string;
}

const DEFAULT_CLINIC_PHONE = '0755 75 45 45';
const DEFAULT_CLINIC_NAME = 'Clinica Dr. Lungu Family';
const DEFAULT_CLINIC_ADDRESS = 'Aleea Spitalului nr. 16, Pitești';

export function buildWhatsAppReportMessage({
  participantName,
  secureReportUrl,
  clinicPhone = DEFAULT_CLINIC_PHONE,
  clinicName = DEFAULT_CLINIC_NAME,
  clinicAddress = DEFAULT_CLINIC_ADDRESS,
}: WhatsAppReportShareMessageInput): string {
  return [
    `Bună ziua, ${participantName}!`,
    '',
    'Vă mulțumim pentru participarea la Campania de Screening Cardiovascular.',
    '',
    `Raportul dumneavoastră: ${secureReportUrl}`,
    '',
    `Programări: 📞 ${clinicPhone}`,
    `📍 ${clinicName}, ${clinicAddress}`,
  ].join('\n');
}

export function buildWhatsAppReportMessageFromReport(
  report: ParticipantReport,
  clinicSettings: ClinicSettingsSnapshot,
): string {
  return buildWhatsAppReportMessage({
    participantName: report.participant.display_name,
    secureReportUrl: buildParticipantReportUrl(report, clinicSettings),
    clinicPhone: clinicSettings.contact.phone,
    clinicName: clinicSettings.clinic.name,
    clinicAddress: clinicSettings.contact.address,
  });
}

export function buildWhatsAppShareUrl(phone: string, message: string): string {
  const normalizedPhone = toWhatsAppPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

export function openWhatsAppShare(phone: string, message: string): void {
  const url = buildWhatsAppShareUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}
