import type { MedicalMeasurements, PatientGender } from '@medscreen/types';

import {
  classifyBloodPressure,
  classifyBmi,
  classifyGlucose,
  classifyPulse,
  classifySpO2,
  classifyWaist,
  type MeasurementBadgeLevel,
} from './measurement-classifiers';

export type { MeasurementBadgeLevel };

export interface PremiumMeasurementRow {
  parameter: string;
  result: string;
  referenceRange: string;
  interpretation: string;
  badgeLevel: MeasurementBadgeLevel;
}

function formatNum(value: number | null, decimals = 0): string {
  if (value === null || value === undefined) return '—';
  return decimals > 0 ? value.toFixed(decimals) : String(value);
}

function buildBloodPressureRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const bp =
    measurements.systolic_bp !== null || measurements.diastolic_bp !== null
      ? `${formatNum(measurements.systolic_bp)} / ${formatNum(measurements.diastolic_bp)}`
      : '—';

  const classification = classifyBloodPressure(measurements);

  return {
    parameter: 'Tensiune arterială',
    result: bp,
    referenceRange: classification?.referenceRange ?? '120/80–129/84 mmHg',
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

function buildPulseRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const classification = classifyPulse(measurements.pulse);

  return {
    parameter: 'Puls',
    result: formatNum(measurements.pulse),
    referenceRange: classification?.referenceRange ?? '60–100',
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

function buildSpO2Row(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const classification = classifySpO2(measurements.oxygen_saturation);

  return {
    parameter: 'SpO₂',
    result: measurements.oxygen_saturation !== null ? `${formatNum(measurements.oxygen_saturation)}%` : '—',
    referenceRange: classification?.referenceRange ?? '≥95%',
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

function buildGlucoseRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const classification = classifyGlucose(measurements);

  return {
    parameter: 'Glicemie',
    result: measurements.blood_glucose !== null ? formatNum(measurements.blood_glucose) : '—',
    referenceRange: classification?.referenceRange ?? 'á jeun <100',
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

function buildBmiRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const classification = classifyBmi(measurements.bmi);

  return {
    parameter: 'IMC',
    result: formatNum(measurements.bmi, 2),
    referenceRange: classification?.referenceRange ?? '18,5–24,9',
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

function buildWaistRow(measurements: MedicalMeasurements, gender: PatientGender): PremiumMeasurementRow {
  const classification = classifyWaist(measurements.waist_circumference_cm, gender);

  return {
    parameter: 'Circumferință abdominală',
    result: measurements.waist_circumference_cm !== null ? `${formatNum(measurements.waist_circumference_cm)} cm` : '—',
    referenceRange: classification?.referenceRange ?? (gender === 'F' ? 'F: <80 cm' : 'M: <94 cm'),
    interpretation: classification?.label ?? '—',
    badgeLevel: classification?.badgeLevel ?? 'neutral',
  };
}

export function buildMeasurementRows(
  measurements: MedicalMeasurements,
  gender: PatientGender,
): PremiumMeasurementRow[] {
  return [
    buildBloodPressureRow(measurements),
    buildPulseRow(measurements),
    buildSpO2Row(measurements),
    buildGlucoseRow(measurements),
    {
      parameter: 'Greutate',
      result: measurements.weight_kg !== null ? `${formatNum(measurements.weight_kg, 1)} kg` : '—',
      referenceRange: '—',
      interpretation: '—',
      badgeLevel: 'neutral',
    },
    {
      parameter: 'Înălțime',
      result: measurements.height_cm !== null ? `${formatNum(measurements.height_cm)} cm` : '—',
      referenceRange: '—',
      interpretation: '—',
      badgeLevel: 'neutral',
    },
    buildBmiRow(measurements),
    {
      parameter: 'Greutate ideală',
      result:
        measurements.ideal_weight_kg !== null
          ? `${formatNum(measurements.ideal_weight_kg, 1)} kg`
          : '—',
      referenceRange: '—',
      interpretation: '—',
      badgeLevel: 'neutral',
    },
    buildWaistRow(measurements, gender),
  ];
}

/** @deprecated Use buildMeasurementRows — alias retained for legacy report imports. */
export const buildPremiumMeasurementRows = buildMeasurementRows;

export { isBloodPressureAbnormal } from './threshold-evaluators';
