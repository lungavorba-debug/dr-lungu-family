import type { MedicalMeasurements } from '@medscreen/types';

import type { MeasurementBadgeLevel } from './report-measurement-interpretation';

export interface MeasurementDisplayRow {
  label: string;
  value: string;
  unit?: string;
}

function formatNum(value: number | null, decimals = 0): string {
  if (value === null || value === undefined) return '—';
  return decimals > 0 ? value.toFixed(decimals) : String(value);
}

function formatGlucoseStatus(status: MedicalMeasurements['blood_glucose_status']): string {
  if (status === 'fasting') return 'A jeun';
  if (status === 'non_fasting') return 'Postprandial';
  return '';
}

export function buildMeasurementRows(measurements: MedicalMeasurements): MeasurementDisplayRow[] {
  return buildParticipantMeasurementRows(measurements);
}

/** Participant-facing measurement list for the clinical report (no internal clinical flags). */
export function buildParticipantMeasurementRows(
  measurements: MedicalMeasurements,
): MeasurementDisplayRow[] {
  const bp =
    measurements.systolic_bp !== null || measurements.diastolic_bp !== null
      ? `${formatNum(measurements.systolic_bp)} / ${formatNum(measurements.diastolic_bp)}`
      : '—';

  return [
    { label: 'Tensiune arterială', value: bp, unit: 'mmHg' },
    { label: 'Puls', value: formatNum(measurements.pulse), unit: 'bpm' },
    { label: 'Saturație oxigen', value: formatNum(measurements.oxygen_saturation), unit: '%' },
    {
      label: 'Glicemie',
      value:
        measurements.blood_glucose !== null
          ? `${formatNum(measurements.blood_glucose)} mg/dL${formatGlucoseStatus(measurements.blood_glucose_status) ? ` (${formatGlucoseStatus(measurements.blood_glucose_status)})` : ''}`
          : '—',
    },
    { label: 'Greutate', value: formatNum(measurements.weight_kg, 1), unit: 'kg' },
    { label: 'Înălțime', value: formatNum(measurements.height_cm, 0), unit: 'cm' },
    { label: 'IMC', value: formatNum(measurements.bmi, 2) },
    { label: 'Greutate ideală', value: formatNum(measurements.ideal_weight_kg, 1), unit: 'kg' },
    {
      label: 'Circumferință abdominală',
      value: formatNum(measurements.waist_circumference_cm),
      unit: 'cm',
    },
  ];
}

export function formatMeasurementNote(
  interpretation: string,
  badgeLevel: MeasurementBadgeLevel,
  _parameter?: string,
): string {
  if (interpretation === '—' || interpretation.trim() === '') return '';
  if (badgeLevel === 'neutral') return '';
  return interpretation;
}

export function groupRecommendationsByPriority(
  recommendations: { code: string; message: string; priority: 'routine' | 'soon' | 'urgent' }[],
) {
  const order: Array<'urgent' | 'soon' | 'routine'> = ['urgent', 'soon', 'routine'];
  const labels: Record<'urgent' | 'soon' | 'routine', string> = {
    urgent: 'Recomandări importante',
    soon: 'De discutat cu medicul',
    routine: 'Recomandări generale',
  };

  return order
    .map((priority) => ({
      priority,
      label: labels[priority],
      items: recommendations.filter((rec) => rec.priority === priority),
    }))
    .filter((group) => group.items.length > 0);
}
