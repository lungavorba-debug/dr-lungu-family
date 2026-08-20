/**
 * Clinical safety tests — evaluation logic remains evidence-based; copy is festival-neutral.
 * Run: npx tsx packages/shared/src/report/test-dynamic-evaluation-summary.ts
 */
import assert from 'node:assert/strict';

import type { MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';

import { classifyBloodPressure } from '../clinical/participant-view/measurement-classifiers';
import { buildDynamicEvaluationSummary } from './build-dynamic-evaluation-summary';
import { FESTIVAL_EVALUATION_SUMMARY } from './festival-participant-copy';

const emptyAnamnesis: ScreeningAnamnesis = {
  smoking_status: 'never',
  alcohol_consumption: 'none',
  known_diabetes: false,
  chest_pain: false,
  dyspnea: false,
  snoring: false,
  current_treatment: '',
  free_notes: '',
};

function baseMeasurements(overrides: Partial<MedicalMeasurements>): MedicalMeasurements {
  return {
    systolic_bp: 118,
    diastolic_bp: 76,
    pulse: 72,
    oxygen_saturation: 98,
    blood_glucose: 92,
    blood_glucose_status: 'fasting',
    weight_kg: 68,
    height_cm: 165,
    bmi: 22.5,
    waist_circumference_cm: 78,
    ideal_weight_kg: 62,
    known_hypertension: false,
    known_diabetes: false,
    current_antihypertensive_treatment: false,
    ...overrides,
  };
}

console.log('[test-dynamic-evaluation-summary] Case 1 — all values normal (90/65 TA)');

const normalBpCase = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({ systolic_bp: 90, diastolic_bp: 65 }),
  anamnesis: emptyAnamnesis,
  gender: 'F',
});

assert.equal(normalBpCase.summary, FESTIVAL_EVALUATION_SUMMARY);
assert.equal(normalBpCase.findings.length, 0);
assert.equal(normalBpCase.levelLabel, 'INFORMAȚII');
assert.equal(classifyBloodPressure(baseMeasurements({ systolic_bp: 90, diastolic_bp: 65 }))?.label, 'Optimă');

console.log('[test-dynamic-evaluation-summary] Case 2 — single abnormal value');

const singleIssue = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({ systolic_bp: 165, diastolic_bp: 102 }),
  anamnesis: emptyAnamnesis,
  gender: 'M',
});

assert.equal(singleIssue.summary, FESTIVAL_EVALUATION_SUMMARY);
assert.equal(singleIssue.findings.length, 1);
assert.equal(singleIssue.levelLabel, 'DE DISCUTAT CU MEDICUL');

console.log('[test-dynamic-evaluation-summary] Case 3 — multiple abnormal values + anamnesis');

const multiIssue = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({
    systolic_bp: 148,
    diastolic_bp: 92,
    blood_glucose: 115,
    bmi: 29.7,
    waist_circumference_cm: 102,
  }),
  anamnesis: {
    ...emptyAnamnesis,
    smoking_status: 'current',
    dyspnea: true,
  },
  gender: 'M',
});

assert.equal(multiIssue.summary, FESTIVAL_EVALUATION_SUMMARY);
assert.ok(multiIssue.findings.length >= 5);

console.log('[test-dynamic-evaluation-summary] All clinical safety assertions passed.');
