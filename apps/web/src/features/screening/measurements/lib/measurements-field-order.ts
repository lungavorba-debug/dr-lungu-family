export const MEASUREMENT_NUMERIC_FIELD_ORDER = [
  'systolic_bp',
  'diastolic_bp',
  'pulse',
  'oxygen_saturation',
  'blood_glucose',
  'weight_kg',
  'height_cm',
  'waist_circumference_cm',
] as const;

export type MeasurementsNumericField = (typeof MEASUREMENT_NUMERIC_FIELD_ORDER)[number];

export type MeasurementsSimulatorForm = Record<MeasurementsNumericField, string>;

export function createEmptyMeasurementsSimulatorForm(): MeasurementsSimulatorForm {
  return {
    systolic_bp: '',
    diastolic_bp: '',
    pulse: '',
    oxygen_saturation: '',
    blood_glucose: '',
    weight_kg: '',
    height_cm: '',
    waist_circumference_cm: '',
  };
}
