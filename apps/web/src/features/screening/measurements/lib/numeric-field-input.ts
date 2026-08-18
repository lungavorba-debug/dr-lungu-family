/** Unified warning shown for unusual values — informational only, never blocks input. */
export const UNUSUAL_MEASUREMENT_VALUE_MESSAGE =
  'Valoare neobișnuită. Verificați dacă măsurătoarea este corectă.';

/** Integer-only measurement input, max 3 digits. */
export function sanitizeThreeDigitIntegerValue(value: string): string {
  return value.replace(/\D/g, '').slice(0, 3);
}

/** Blood pressure fields accept digits only, max 3. */
export function sanitizeBloodPressureValue(value: string): string {
  return sanitizeThreeDigitIntegerValue(value);
}

/** @deprecated Prefer sanitizeThreeDigitIntegerValue for touch measurements. */
export function sanitizeNumericFieldValue(value: string): string {
  return sanitizeThreeDigitIntegerValue(value);
}

export type BloodPressureFieldKind = 'systolic' | 'diastolic';

export type MeasurementNumericField =
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'pulse'
  | 'oxygen_saturation'
  | 'blood_glucose'
  | 'weight_kg'
  | 'height_cm'
  | 'waist_circumference_cm';

/**
 * Auto-advance after the last valid digit:
 * - 3 digits always completes the reading
 * - 2 digits when the value is in a typical complete clinical range
 */
export function shouldAutoAdvanceBloodPressure(
  field: BloodPressureFieldKind,
  value: string,
): boolean {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) {
    return false;
  }

  const numeric = Number.parseInt(digits, 10);
  if (Number.isNaN(numeric)) {
    return false;
  }

  if (digits.length >= 3) {
    return true;
  }

  if (digits.length === 2) {
    if (field === 'systolic') {
      return numeric >= 80 && numeric <= 99;
    }
    return numeric >= 40 && numeric <= 99;
  }

  return false;
}

export function shouldAutoAdvanceMeasurementField(field: MeasurementNumericField, value: string): boolean {
  if (field === 'systolic_bp') {
    return shouldAutoAdvanceBloodPressure('systolic', value);
  }
  if (field === 'diastolic_bp') {
    return shouldAutoAdvanceBloodPressure('diastolic', value);
  }

  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) {
    return false;
  }

  const numeric = Number.parseInt(digits, 10);
  if (Number.isNaN(numeric)) {
    return false;
  }

  if (digits.length >= 3) {
    return true;
  }

  if (digits.length === 2) {
    switch (field) {
      case 'pulse':
        return numeric >= 40 && numeric <= 99;
      case 'oxygen_saturation':
        return numeric >= 90 && numeric <= 99;
      case 'blood_glucose':
        return numeric >= 40 && numeric <= 99;
      case 'weight_kg':
        return numeric >= 18 && numeric <= 99;
      case 'height_cm':
        return false;
      case 'waist_circumference_cm':
        return numeric >= 40 && numeric <= 99;
      default:
        return false;
    }
  }

  return false;
}

/** @deprecated Use shouldAutoAdvanceBloodPressure('systolic', value) */
export function shouldAutoAdvanceFromSystolic(value: string): boolean {
  return shouldAutoAdvanceBloodPressure('systolic', value);
}
