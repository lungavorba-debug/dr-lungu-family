import type { ClinicSettingsSnapshot } from '@medscreen/types';

export interface ManualWhatsAppDeliveryMessageInput {
  participantName: string;
  eventName: string;
  clinicPhone: string;
  clinicName: string;
  clinicAddress: string;
}

export function buildManualWhatsAppDeliveryMessage({
  participantName,
  eventName,
  clinicPhone,
  clinicName,
  clinicAddress,
}: ManualWhatsAppDeliveryMessageInput): string {
  return [
    `Bună ziua, ${participantName}!`,
    '',
    `Vă mulțumim pentru participarea la Campania de Screening ${eventName}.`,
    '',
    'Raportul PDF este atașat acestui mesaj.',
    '',
    `Programări: ${clinicPhone}`,
    `📍 ${clinicName}, ${clinicAddress}`,
    '',
    'Echipa Dr. Lungu Family',
  ].join('\n');
}

export function buildManualWhatsAppDeliveryMessageFromSettings(
  participantName: string,
  eventName: string,
  clinicSettings: ClinicSettingsSnapshot,
): string {
  return buildManualWhatsAppDeliveryMessage({
    participantName,
    eventName,
    clinicPhone: clinicSettings.contact.phone,
    clinicName: clinicSettings.clinic.name,
    clinicAddress: clinicSettings.contact.address,
  });
}
