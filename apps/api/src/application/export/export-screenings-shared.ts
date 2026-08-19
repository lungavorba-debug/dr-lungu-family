import type { ScreeningExportRecord } from '../../domain/repositories/screening.repository';
import { formatParticipantCity } from '@medscreen/shared';

export const EXPORT_SCREENINGS_HEADERS = [
  'ID screening',
  'Data finalizare',
  'Nume',
  'Prenume',
  'Telefon',
  'Varsta',
  'Sex',
  'Localitate',
  'Operator',
  'TA sistolica',
  'TA diastolica',
  'Puls',
  'SpO2',
  'Glicemie',
  'IMC',
  'Circumferinta talie',
  'Caz critic',
  'PDF disponibil',
  'Semnatura',
  'Data semnatura',
  'PDF individual',
] as const;

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

export function formatSignatureExportStatus(row: ScreeningExportRecord): string {
  if (row.hasSignature) {
    return row.signatureSignedAt ? 'Semnat' : 'Semnat (fără dată)';
  }
  return 'Nesemnat';
}

export function mapScreeningExportRow(row: ScreeningExportRecord): (string | number)[] {
  return [
    row.id,
    formatDateTime(row.completedAt),
    row.patientLastName ?? '',
    row.patientFirstName ?? '',
    row.patientPhone ?? '',
    row.patientAge ?? '',
    row.patientGender ?? '',
    row.patientCity ? (formatParticipantCity(row.patientCity) ?? row.patientCity) : '',
    `${row.operatorLastName} ${row.operatorFirstName}`,
    row.systolicBp ?? '',
    row.diastolicBp ?? '',
    row.pulse ?? '',
    row.oxygenSaturation ?? '',
    row.bloodGlucose ?? '',
    row.bmi ?? '',
    row.waistCircumferenceCm ?? '',
    row.hasCriticalWarning ? 'Da' : 'Nu',
    row.hasPdf ? 'Da' : 'Nu',
    formatSignatureExportStatus(row),
    row.signatureSignedAt ? formatDateTime(row.signatureSignedAt) : '',
    row.pdfFilename ?? '',
  ];
}

export const EXPORT_SCREENINGS_MAX_ROWS = 10000;

export function resolveSignatureImageExtension(mimeType: string | null | undefined): 'png' | 'jpeg' {
  return mimeType === 'image/jpeg' ? 'jpeg' : 'png';
}
