import {
  MEASUREMENT_NUMERIC_FIELD_ORDER,
  createEmptyMeasurementsSimulatorForm,
  type MeasurementsNumericField,
  type MeasurementsSimulatorForm,
} from './measurements-field-order';
import {
  sanitizeBloodPressureValue,
  sanitizeThreeDigitIntegerValue,
  shouldAutoAdvanceMeasurementField,
} from './numeric-field-input';

export interface MeasurementsInputSimulatorState {
  form: MeasurementsSimulatorForm;
  activeField: MeasurementsNumericField;
}

function advanceFromField(activeField: MeasurementsNumericField): MeasurementsNumericField {
  if (activeField === 'systolic_bp') {
    return 'diastolic_bp';
  }

  const index = MEASUREMENT_NUMERIC_FIELD_ORDER.indexOf(activeField);
  return MEASUREMENT_NUMERIC_FIELD_ORDER[index + 1] ?? activeField;
}

function appendDigit(state: MeasurementsInputSimulatorState, digit: string): MeasurementsInputSimulatorState {
  const { form, activeField } = state;
  const current = form[activeField];

  if (activeField === 'systolic_bp' || activeField === 'diastolic_bp') {
    const digits = current.replace(/\D/g, '');
    if (digits.length >= 3) {
      return state;
    }

    const sanitized = sanitizeBloodPressureValue(`${current}${digit}`);
    const nextForm = { ...form, [activeField]: sanitized };

    if (shouldAutoAdvanceMeasurementField(activeField, sanitized)) {
      return {
        form: nextForm,
        activeField: advanceFromField(activeField),
      };
    }

    return { form: nextForm, activeField };
  }

  const digits = current.replace(/\D/g, '');
  if (digits.length >= 3) {
    return state;
  }

  const sanitized = sanitizeThreeDigitIntegerValue(`${current}${digit}`);
  const nextForm = { ...form, [activeField]: sanitized };

  if (shouldAutoAdvanceMeasurementField(activeField, sanitized)) {
    return {
      form: nextForm,
      activeField: advanceFromField(activeField),
    };
  }

  return { form: nextForm, activeField };
}

function pressNext(state: MeasurementsInputSimulatorState): MeasurementsInputSimulatorState {
  return {
    ...state,
    activeField: advanceFromField(state.activeField),
  };
}

function tapField(
  state: MeasurementsInputSimulatorState,
  field: MeasurementsNumericField,
): MeasurementsInputSimulatorState {
  return { ...state, activeField: field };
}

/** Simulates touch keypad entry for operator usability verification. */
export function simulateMeasurementsKeypadEntry(values: string[]): MeasurementsInputSimulatorState {
  let state: MeasurementsInputSimulatorState = {
    form: createEmptyMeasurementsSimulatorForm(),
    activeField: 'systolic_bp',
  };

  for (let index = 0; index < values.length; index += 1) {
    const targetField = MEASUREMENT_NUMERIC_FIELD_ORDER[index];
    const expectedValue = values[index];

    if (state.activeField !== targetField) {
      state = tapField(state, targetField);
    }

    for (const digit of expectedValue) {
      state = appendDigit(state, digit);
    }

    if (state.form[targetField] !== expectedValue) {
      throw new Error(
        `Blocked at ${targetField}: expected "${expectedValue}", got "${state.form[targetField]}"`,
      );
    }

    if (index < values.length - 1 && state.activeField === targetField) {
      state = pressNext(state);
    }
  }

  return state;
}

export function simulateMeasurementsEnterKey(
  state: MeasurementsInputSimulatorState,
): MeasurementsInputSimulatorState {
  return pressNext(state);
}
