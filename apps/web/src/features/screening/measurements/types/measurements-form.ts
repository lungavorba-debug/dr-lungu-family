import type { MedicalMeasurements, PatientGender } from '@medscreen/types';
import type { MeasurementWarning } from '@medscreen/shared';
import { calculateBmi, calculateIdealWeight, getBloodPressureOrderError, getMeasurementWarnings } from '@medscreen/shared';

export type MeasurementsFormState = {
  [K in keyof MedicalMeasurements]: MedicalMeasurements[K] extends number | null
    ? string
    : MedicalMeasurements[K] extends boolean | null
      ? boolean | null
      : MedicalMeasurements[K];
};

export const MEASUREMENT_FIELD_ORDER: (keyof MeasurementsFormState)[] = [
  'systolic_bp',
  'diastolic_bp',
  'pulse',
  'oxygen_saturation',
  'blood_glucose',
  'weight_kg',
  'height_cm',
  'waist_circumference_cm',
];

export function measurementsToFormState(measurements: MedicalMeasurements): MeasurementsFormState {
  const toStringValue = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value);

  return formWithComputedAnthropometry(
    {
      systolic_bp: toStringValue(measurements.systolic_bp),
      diastolic_bp: toStringValue(measurements.diastolic_bp),
      pulse: toStringValue(measurements.pulse),
      oxygen_saturation: toStringValue(measurements.oxygen_saturation),
      blood_glucose: toStringValue(measurements.blood_glucose),
      blood_glucose_status: measurements.blood_glucose_status ?? '',
      weight_kg: toStringValue(measurements.weight_kg),
      height_cm: toStringValue(measurements.height_cm),
      bmi: toStringValue(measurements.bmi),
      ideal_weight_kg: toStringValue(measurements.ideal_weight_kg),
      waist_circumference_cm: toStringValue(measurements.waist_circumference_cm),
      known_hypertension: measurements.known_hypertension,
      known_diabetes: measurements.known_diabetes,
      current_antihypertensive_treatment: measurements.current_antihypertensive_treatment,
    },
    null,
  );
}

export function createEmptyMeasurementsForm(): MeasurementsFormState {
  return {
    systolic_bp: '',
    diastolic_bp: '',
    pulse: '',
    oxygen_saturation: '',
    blood_glucose: '',
    blood_glucose_status: '',
    weight_kg: '',
    height_cm: '',
    bmi: '',
    ideal_weight_kg: '',
    waist_circumference_cm: '',
    known_hypertension: null,
    known_diabetes: null,
    current_antihypertensive_treatment: null,
  };
}

export function parseMeasurementsForm(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): MedicalMeasurements {
  const parseNum = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const weight = parseNum(form.weight_kg);
  const height = parseNum(form.height_cm);
  const bmi = calculateBmi(weight, height);
  const ideal_weight_kg = calculateIdealWeight(height, gender ?? null);

  return {
    systolic_bp: parseNum(form.systolic_bp),
    diastolic_bp: parseNum(form.diastolic_bp),
    pulse: parseNum(form.pulse),
    oxygen_saturation: parseNum(form.oxygen_saturation),
    blood_glucose: parseNum(form.blood_glucose),
    blood_glucose_status: form.blood_glucose_status,
    weight_kg: weight,
    height_cm: height,
    bmi,
    ideal_weight_kg,
    waist_circumference_cm: parseNum(form.waist_circumference_cm),
    known_hypertension: form.known_hypertension,
    known_diabetes: form.known_diabetes,
    current_antihypertensive_treatment: form.current_antihypertensive_treatment,
  };
}

export function formWithComputedAnthropometry(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): MeasurementsFormState {
  const parseHeight = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number.parseFloat(value.replace(',', '.'));
    return Number.isNaN(parsed) ? null : parsed;
  };

  const weight = form.weight_kg ? Number.parseFloat(form.weight_kg.replace(',', '.')) : null;
  const height = parseHeight(form.height_cm);
  const bmi = calculateBmi(weight, height);
  const ideal_weight_kg = calculateIdealWeight(height, gender ?? null);
  return {
    ...form,
    bmi: bmi === null ? '' : String(bmi),
    ideal_weight_kg: ideal_weight_kg === null ? '' : String(ideal_weight_kg),
  };
}

/** @deprecated Use formWithComputedAnthropometry */
export function formWithComputedBmi(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): MeasurementsFormState {
  return formWithComputedAnthropometry(form, gender);
}

export function getBloodPressureOrderErrorForForm(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): MeasurementWarning | null {
  return getBloodPressureOrderError(parseMeasurementsForm(form, gender));
}

export function getWarningsForForm(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): MeasurementWarning[] {
  return getMeasurementWarnings(parseMeasurementsForm(form, gender));
}

export function getWarningFields(
  form: MeasurementsFormState,
  gender?: PatientGender | null,
): Set<string> {
  return new Set(getWarningsForForm(form, gender).map((warning) => warning.field));
}
