import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  sanitizeBloodPressureValue,
  sanitizeThreeDigitIntegerValue,
  shouldAutoAdvanceBloodPressure,
  shouldAutoAdvanceMeasurementField,
} from './lib/numeric-field-input.ts';
import {
  sanitizeAgeValue,
  shouldAutoAdvanceAge,
} from '../conversation/lib/age-field-input.ts';
import { detectProbableGender } from '../conversation/lib/gender-detection.ts';
import {
  simulateMeasurementsEnterKey,
  simulateMeasurementsKeypadEntry,
} from './lib/measurements-input-navigation.ts';
import { MEASUREMENT_NUMERIC_FIELD_ORDER } from './lib/measurements-field-order.ts';
import { calculateIdealWeight } from '../../../../../../packages/shared/src/schemas/measurements.schema.ts';
import { formatPhoneInput, normalizePhone } from '../../../../../../packages/shared/src/utils/phone.ts';
import {
  calculateConversationProgress,
  createEmptyConversationForm,
} from '../conversation/types/conversation-form.ts';

function assert(name: string, ok: boolean, detail = '') {
  console.log(`OP-TEST: ${name}`, ok ? 'PASS' : 'FAIL', detail);
  if (!ok) {
    process.exitCode = 1;
  }
}

assert('phone formats while typing', formatPhoneInput('0722123') === '0722 123');
assert('phone full format', formatPhoneInput('0722123456') === '0722 123 456');
assert('normalize strips spaces', normalizePhone('0722 123 456') === '0722123456');

assert('bp max 3 digits', sanitizeBloodPressureValue('1234') === '123');
assert('bp digits only', sanitizeBloodPressureValue('12a3') === '123');
assert('integer max 3 digits', sanitizeThreeDigitIntegerValue('1234') === '123');
assert('systolic auto-advance at 120', shouldAutoAdvanceBloodPressure('systolic', '120') === true);
assert('systolic auto-advance at 300', shouldAutoAdvanceBloodPressure('systolic', '300') === true);
assert('systolic auto-advance at 90', shouldAutoAdvanceBloodPressure('systolic', '90') === true);
assert('systolic no auto-advance at 12', shouldAutoAdvanceBloodPressure('systolic', '12') === false);
assert('diastolic auto-advance at 80', shouldAutoAdvanceBloodPressure('diastolic', '80') === true);
assert('diastolic auto-advance at 200', shouldAutoAdvanceBloodPressure('diastolic', '200') === true);
assert('diastolic auto-advance at 100', shouldAutoAdvanceBloodPressure('diastolic', '100') === true);
assert('pulse auto-advance at 72', shouldAutoAdvanceMeasurementField('pulse', '72') === true);
assert('pulse auto-advance at 120', shouldAutoAdvanceMeasurementField('pulse', '120') === true);
assert('pulse no auto-advance at 12', shouldAutoAdvanceMeasurementField('pulse', '12') === false);
assert('spo2 auto-advance at 98', shouldAutoAdvanceMeasurementField('oxygen_saturation', '98') === true);
assert('glucose auto-advance at 110', shouldAutoAdvanceMeasurementField('blood_glucose', '110') === true);
assert('weight auto-advance at 82', shouldAutoAdvanceMeasurementField('weight_kg', '82') === true);
assert('height no auto-advance at 2 digits', shouldAutoAdvanceMeasurementField('height_cm', '17') === false);
assert('height auto-advance at 175', shouldAutoAdvanceMeasurementField('height_cm', '175') === true);
assert('waist auto-advance at 95', shouldAutoAdvanceMeasurementField('waist_circumference_cm', '95') === true);

assert('age max 3 digits', sanitizeAgeValue('1234') === '123');
assert('age auto-advance at 45', shouldAutoAdvanceAge('45') === true);
assert('age auto-advance at 120', shouldAutoAdvanceAge('120') === true);
assert('age no auto-advance at 8', shouldAutoAdvanceAge('8') === false);
assert('gender Maria -> F', detectProbableGender('Maria') === 'F');
assert('gender Ion -> M', detectProbableGender('Ion') === 'M');
assert('gender unknown stays null', detectProbableGender('Xyz') === null);

assert(
  'ideal weight male at 175cm',
  calculateIdealWeight(175, 'M') === 70.7,
);
assert(
  'ideal weight female at 175cm',
  calculateIdealWeight(175, 'F') === 66.2,
);
assert(
  'ideal weight null without gender',
  calculateIdealWeight(175, null) === null,
);

const measurementsPageSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'pages/ScreeningMeasurementsPage.tsx'),
  'utf8',
);
assert(
  'measurements form recomputes anthropometry on height change',
  measurementsPageSource.includes('formWithComputedAnthropometry') &&
    measurementsPageSource.includes("field === 'height_cm'"),
);

const completeForm = {
  ...createEmptyConversationForm(),
  first_name: 'Ion',
  last_name: 'Popescu',
  phone: '0722123456',
  age: '45',
  gender: 'M' as const,
  city: 'Corbeni',
  smoking_status: 'never' as const,
  current_treatment: '',
  free_notes: '',
};
const progressComplete = calculateConversationProgress(completeForm);
assert(
  'empty current treatment does not block',
  progressComplete.missingRequired.length === 0,
  progressComplete.missingRequired.join(', '),
);

assert('measurements page uses sticky save bar', measurementsPageSource.includes('StickyScreeningActionBar'));
assert('measurements page shows participant banner', measurementsPageSource.includes('ScreeningParticipantBanner'));
assert('measurements page shows ideal weight field', measurementsPageSource.includes('ReadOnlyIdealWeightField'));
assert(
  'ideal weight display uses derived parsed value',
  measurementsPageSource.includes('idealWeightDisplay'),
);
assert(
  'draft restore recomputes ideal weight',
  measurementsPageSource.includes('formWithComputedAnthropometry') &&
    measurementsPageSource.includes('measurementsDraft'),
);
assert('measurements page recomputes on gender change', measurementsPageSource.includes('activePatient?.gender'));
assert(
  'save action stacked above touch keypad',
  measurementsPageSource.includes('layout="inline"') &&
    measurementsPageSource.includes('Salvează măsurătorile'),
);
assert(
  'inline save button removed from scroll content',
  !measurementsPageSource.includes('flex min-h-[64px] w-full items-center justify-center rounded-2xl bg-brand-primary'),
);
assert(
  'initial focus runs once on mount',
  measurementsPageSource.includes('didInitialFocus') &&
    measurementsPageSource.includes('didInitialFocus.current'),
);
assert(
  'review warnings navigates to first field',
  measurementsPageSource.includes('handleReviewWarnings') &&
    measurementsPageSource.includes('reviewHighlight'),
);

const highBpSimulation = simulateMeasurementsKeypadEntry(['300', '200']);
assert('high bp systolic accepted', highBpSimulation.form.systolic_bp === '300');
assert('high bp diastolic accepted', highBpSimulation.form.diastolic_bp === '200');

const operatorValues = ['120', '80', '72', '98', '110', '82', '175', '95'];
const simulated = simulateMeasurementsKeypadEntry(operatorValues);

for (let index = 0; index < operatorValues.length; index += 1) {
  const field = MEASUREMENT_NUMERIC_FIELD_ORDER[index];
  const actual = simulated.form[field];
  assert(
    `mobile simulation ${field}`,
    actual === operatorValues[index],
    `${actual} !== ${operatorValues[index]}`,
  );
}

assert(
  'mobile simulation ends on last field',
  simulated.activeField === 'waist_circumference_cm',
  simulated.activeField,
);

const partialEntry = simulateMeasurementsKeypadEntry(['12']);
assert(
  'partial systolic stays until explicit advance',
  partialEntry.activeField === 'systolic_bp',
  partialEntry.activeField,
);
const enterState = simulateMeasurementsEnterKey(partialEntry);
assert(
  'enter/next moves systolic to diastolic',
  enterState.activeField === 'diastolic_bp',
  enterState.activeField,
);

if (process.exitCode === 1) {
  throw new Error('Operator test fixes validation failed');
}

console.log('Measurements input flow tests completed successfully.');
