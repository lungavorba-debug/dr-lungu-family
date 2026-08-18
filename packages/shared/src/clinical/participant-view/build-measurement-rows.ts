import type { MedicalMeasurements, PatientGender } from '@medscreen/types';

import { CLINICAL_THRESHOLDS } from '../thresholds';
import {
  isBloodPressureCritical,
  isBloodPressureElevated,
  isBloodPressureLow,
  isBmiElevated,
  isGlucoseElevated,
  isPulseHigh,
  isPulseLow,
  isSpO2Low,
  isWaistElevated,
} from './threshold-evaluators';

export { isBloodPressureAbnormal } from './threshold-evaluators';

export type MeasurementBadgeLevel = 'normal' | 'attention' | 'critical' | 'neutral';

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

  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (measurements.systolic_bp !== null || measurements.diastolic_bp !== null) {
    if (isBloodPressureCritical(measurements)) {
      badgeLevel = 'critical';
      interpretation = 'Crescută';
    } else if (isBloodPressureElevated(measurements)) {
      badgeLevel = 'attention';
      interpretation = 'Crescută';
    } else if (isBloodPressureLow(measurements)) {
      badgeLevel = 'attention';
      interpretation = 'Scăzută';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normală';
    }
  }

  return {
    parameter: 'Tensiune arterială',
    result: bp,
    referenceRange: 'sub 140/90',
    interpretation,
    badgeLevel,
  };
}

function buildPulseRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const pulse = measurements.pulse;
  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (pulse !== null) {
    if (isPulseLow(pulse)) {
      badgeLevel = 'attention';
      interpretation = 'Scăzut';
    } else if (isPulseHigh(pulse)) {
      badgeLevel = 'attention';
      interpretation = 'Crescut';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normal';
    }
  }

  return {
    parameter: 'Puls',
    result: formatNum(pulse),
    referenceRange: '60–100',
    interpretation,
    badgeLevel,
  };
}

function buildSpO2Row(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const spo2 = measurements.oxygen_saturation;
  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (spo2 !== null) {
    if (isSpO2Low(spo2)) {
      badgeLevel = 'critical';
      interpretation = 'Scăzută';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normală';
    }
  }

  return {
    parameter: 'SpO₂',
    result: spo2 !== null ? `${formatNum(spo2)}%` : '—',
    referenceRange: 'min. 95%',
    interpretation,
    badgeLevel,
  };
}

function buildGlucoseRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const glucose = measurements.blood_glucose;
  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (glucose !== null) {
    if (isGlucoseElevated(measurements)) {
      badgeLevel = 'attention';
      interpretation = 'Crescută';
    } else if (glucose < CLINICAL_THRESHOLDS.glucose.low) {
      badgeLevel = 'attention';
      interpretation = 'Scăzută';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normală';
    }
  }

  return {
    parameter: 'Glicemie',
    result: glucose !== null ? formatNum(glucose) : '—',
    referenceRange: '70–99',
    interpretation,
    badgeLevel,
  };
}

function buildBmiRow(measurements: MedicalMeasurements): PremiumMeasurementRow {
  const bmi = measurements.bmi;
  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (bmi !== null) {
    if (isBmiElevated(bmi)) {
      badgeLevel = 'attention';
      interpretation = 'Crescut';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normal';
    }
  }

  return {
    parameter: 'IMC',
    result: formatNum(bmi, 2),
    referenceRange: '18,5–24,9',
    interpretation,
    badgeLevel,
  };
}

function buildWaistRow(measurements: MedicalMeasurements, gender: PatientGender): PremiumMeasurementRow {
  const waist = measurements.waist_circumference_cm;
  let badgeLevel: MeasurementBadgeLevel = 'neutral';
  let interpretation = '—';

  if (waist !== null) {
    if (isWaistElevated(waist, gender)) {
      badgeLevel = 'attention';
      interpretation = 'Crescută';
    } else {
      badgeLevel = 'normal';
      interpretation = 'Normală';
    }
  }

  return {
    parameter: 'Circumferință abdominală',
    result: waist !== null ? `${formatNum(waist)} cm` : '—',
    referenceRange: gender === 'F' ? 'sub 80 cm' : 'sub 94 cm',
    interpretation,
    badgeLevel,
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
