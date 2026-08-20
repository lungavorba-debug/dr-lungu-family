import type { MedicalMeasurements, PatientGender } from '@medscreen/types';

import { CLINICAL_THRESHOLDS } from '../thresholds';

export function isBloodPressureCritical(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null &&
      measurements.systolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.urgentSystolic) ||
    (measurements.diastolic_bp !== null &&
      measurements.diastolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.urgentDiastolic)
  );
}

export function isBloodPressureElevated(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null &&
      measurements.systolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.elevatedSystolic) ||
    (measurements.diastolic_bp !== null &&
      measurements.diastolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.elevatedDiastolic)
  );
}

export function isBloodPressureLow(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null &&
      measurements.systolic_bp < CLINICAL_THRESHOLDS.bloodPressure.lowSystolic) ||
    (measurements.diastolic_bp !== null &&
      measurements.diastolic_bp < CLINICAL_THRESHOLDS.bloodPressure.lowDiastolic)
  );
}

export function isBloodPressureAbnormal(measurements: MedicalMeasurements): boolean {
  return isBloodPressureElevated(measurements) || isBloodPressureLow(measurements);
}

export function isGlucoseElevated(measurements: MedicalMeasurements): boolean {
  const glucose = measurements.blood_glucose;
  if (glucose === null) return false;

  if (measurements.blood_glucose_status === 'fasting') {
    return glucose >= CLINICAL_THRESHOLDS.glucose.fastingModerate;
  }
  if (measurements.blood_glucose_status === 'non_fasting') {
    return glucose >= CLINICAL_THRESHOLDS.glucose.nonFastingModerate;
  }
  return glucose >= CLINICAL_THRESHOLDS.glucose.fastingModerate;
}

export function isWaistElevated(waistCm: number | null, gender: PatientGender): boolean {
  if (waistCm === null) return false;
  return waistCm >= CLINICAL_THRESHOLDS.waist[gender === 'F' ? 'female' : 'male'];
}

export function isPulseLow(pulse: number): boolean {
  return pulse < CLINICAL_THRESHOLDS.pulse.low;
}

export function isPulseHigh(pulse: number): boolean {
  return pulse > CLINICAL_THRESHOLDS.pulse.high;
}

export function isPulseAbnormal(measurements: MedicalMeasurements): boolean {
  const pulse = measurements.pulse;
  if (pulse === null) return false;
  return isPulseLow(pulse) || isPulseHigh(pulse);
}

export function isSpO2Low(spo2: number | null): boolean {
  if (spo2 === null) return false;
  return spo2 < CLINICAL_THRESHOLDS.spo2.low;
}

export function isBmiElevated(bmi: number | null): boolean {
  if (bmi === null) return false;
  return bmi >= CLINICAL_THRESHOLDS.bmi.elevated;
}
