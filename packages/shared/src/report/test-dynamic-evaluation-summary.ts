/**
 * Clinical safety tests — dynamic "Evaluare și recomandări" must match real measurements.
 * Run: npx tsx packages/shared/src/report/test-dynamic-evaluation-summary.ts
 */
import assert from 'node:assert/strict';

import type { MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';

import { classifyBloodPressure } from '../clinical/participant-view/measurement-classifiers';
import { buildMeasurementRows } from '../clinical/participant-view/build-measurement-rows';
import { composeParticipantReport } from './composer/compose-participant-report';
import { buildDynamicEvaluationSummary } from './build-dynamic-evaluation-summary';
import { loadScenario } from './fixtures/load-fixtures';

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

assert.match(normalBpCase.summary, /limite normale/i, 'Normal case must state values are within normal limits');
assert.doesNotMatch(
  normalBpCase.summary,
  /peste limitele obișnuite|Hipertensiune|tensiune arterială \(90\/65 mmHg\)/i,
  'Normal BP must not trigger alarming hypertension text',
);
assert.equal(normalBpCase.levelLabel, 'NORMAL');

const bpRow = buildMeasurementRows(baseMeasurements({ systolic_bp: 90, diastolic_bp: 65 }), 'F').find(
  (row) => row.parameter === 'Tensiune arterială',
);
assert.equal(bpRow?.interpretation, 'Optimă');

console.log('[test-dynamic-evaluation-summary] Case 2 — single abnormal value (HT grad 2)');

const singleIssue = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({ systolic_bp: 165, diastolic_bp: 102 }),
  anamnesis: emptyAnamnesis,
  gender: 'M',
});

assert.match(singleIssue.summary, /Hipertensiune grad 2/i);
assert.match(singleIssue.summary, /165\/102/);
assert.doesNotMatch(singleIssue.summary, /Glicemie|SpO|Fumător|IMC/i, 'Single-issue summary must not mention unrelated parameters');
assert.equal(singleIssue.findings.length, 1);

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

assert.match(multiIssue.summary, /Hipertensiune grad 1/i);
assert.match(multiIssue.summary, /Prediabet/i);
assert.match(multiIssue.summary, /Supraponderal|IMC/i);
assert.match(multiIssue.summary, /Circumferință abdominală/i);
assert.match(multiIssue.summary, /Fumător activ/i);
assert.match(multiIssue.summary, /dispnee|Lipsă de aer/i);
assert.ok(multiIssue.findings.length >= 5, 'Multi-finding case must list several distinct findings');
assert.doesNotMatch(
  multiIssue.summary,
  /peste limitele obișnuite/i,
  'Must not use deprecated static hypertension boilerplate',
);

console.log('[test-dynamic-evaluation-summary] Integration — healthy golden scenario report');

const healthy = loadScenario('healthy');
const healthyReport = composeParticipantReport({
  participant: {
    first_name: healthy.participant.first_name,
    last_name: healthy.participant.last_name,
    age: healthy.participant.age,
    gender: healthy.participant.gender,
    phone: null,
    city: null,
  },
  campaign: healthy.campaign,
  screeningDate: healthy.captured_at,
  operatorName: healthy.operatorName,
  measurements: healthy.measurements,
  anamnesis: healthy.anamnesis,
  evaluation: {
    engine_version: 'test',
    rule_set_id: 'test',
    is_demo: false,
    evaluated_at: healthy.captured_at,
    screening_id: healthy.screening_id,
    patient_id: healthy.patient_id,
    risks: {
      cardiovascular: {
        category: 'cardiovascular',
        level: 'elevated',
        summary: '',
        factors: ['Durere toracică raportată'],
        rule_set_id: 'test',
        is_demo: false,
      },
      diabetes: {
        category: 'diabetes',
        level: 'low',
        summary: '',
        factors: [],
        rule_set_id: 'test',
        is_demo: false,
      },
      sleep_apnea: {
        category: 'sleep_apnea',
        level: 'low',
        summary: '',
        factors: [],
        rule_set_id: 'test',
        is_demo: false,
      },
    },
    warnings: [],
    recommendations: [],
    interpretation: { summary: '', sections: [] },
  },
});

assert.match(healthyReport.layout.cardiovascular_risk.summary, /limite normale/i);
assert.equal(classifyBloodPressure(healthy.measurements)?.label, 'Optimă');

console.log('[test-dynamic-evaluation-summary] All clinical safety assertions passed.');
