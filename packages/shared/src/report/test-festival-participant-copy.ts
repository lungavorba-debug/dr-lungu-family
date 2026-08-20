/**
 * Festival participant copy tests.
 * Run: npx tsx packages/shared/src/report/test-festival-participant-copy.ts
 */
import assert from 'node:assert/strict';

import type { MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';

import { buildMeasurementRows } from '../clinical/participant-view/build-measurement-rows';
import { buildDynamicEvaluationSummary } from './build-dynamic-evaluation-summary';
import {
  FESTIVAL_EVALUATION_SUMMARY,
  toFestivalParticipantLabel,
} from './festival-participant-copy';
import { classifyBloodPressure, classifyBmi, classifyPulse } from '../clinical/participant-view/measurement-classifiers';
import { composeParticipantReport } from './composer/compose-participant-report';
import { loadScenario } from './fixtures/load-fixtures';

const forbiddenLabels = /Hipotensiune|Bradicardie|Tahicardie|Sugestiv diabet|Supraponderal|Obezitate|Hipertensiune|Prediabet|Risc foarte crescut/i;

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

console.log('[test-festival-copy] Measurement table uses neutral labels');

const rows = buildMeasurementRows(
  baseMeasurements({ systolic_bp: 85, diastolic_bp: 55, pulse: 52, bmi: 31.2, waist_circumference_cm: 104 }),
  'M',
);

for (const row of rows) {
  if (row.interpretation === '—') continue;
  assert.doesNotMatch(row.interpretation, forbiddenLabels, `${row.parameter} label must be festival-neutral`);
}

assert.equal(
  rows.find((row) => row.parameter === 'Tensiune arterială')?.interpretation,
  'Valoare scăzută',
);
assert.equal(rows.find((row) => row.parameter === 'Puls')?.interpretation, 'Valoare scăzută');
assert.equal(rows.find((row) => row.parameter === 'IMC')?.interpretation, 'Valoare crescută');
assert.equal(
  rows.find((row) => row.parameter === 'Circumferință abdominală')?.interpretation,
  'Atenție sporită',
);

assert.equal(toFestivalParticipantLabel(classifyBloodPressure(baseMeasurements({ systolic_bp: 90, diastolic_bp: 65 }))!), 'În limite');

console.log('[test-festival-copy] Unified evaluation paragraph');

const normalSummary = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({ systolic_bp: 90, diastolic_bp: 65 }),
  anamnesis: emptyAnamnesis,
  gender: 'F',
});
assert.equal(normalSummary.summary, FESTIVAL_EVALUATION_SUMMARY);
assert.equal(normalSummary.levelLabel, 'INFORMAȚII');

const multiSummary = buildDynamicEvaluationSummary({
  measurements: baseMeasurements({ systolic_bp: 165, diastolic_bp: 102, blood_glucose: 115 }),
  anamnesis: { ...emptyAnamnesis, smoking_status: 'current', chest_pain: true },
  gender: 'M',
});
assert.equal(multiSummary.summary, FESTIVAL_EVALUATION_SUMMARY);
assert.doesNotMatch(multiSummary.summary, forbiddenLabels);
assert.doesNotMatch(multiSummary.summary, /Tensiune arterială|Glicemie|Fumător/i);
assert.equal(multiSummary.levelLabel, 'DE DISCUTAT CU MEDICUL');

console.log('[test-festival-copy] Report integration');

const healthy = loadScenario('healthy');
const report = composeParticipantReport({
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
      cardiovascular: { category: 'cardiovascular', level: 'elevated', summary: '', factors: [], rule_set_id: 'test', is_demo: false },
      diabetes: { category: 'diabetes', level: 'low', summary: '', factors: [], rule_set_id: 'test', is_demo: false },
      sleep_apnea: { category: 'sleep_apnea', level: 'low', summary: '', factors: [], rule_set_id: 'test', is_demo: false },
    },
    warnings: [],
    recommendations: [],
    interpretation: { summary: '', sections: [] },
  },
});

assert.equal(report.layout.cardiovascular_risk.summary, FESTIVAL_EVALUATION_SUMMARY);
for (const row of report.measurements.rows) {
  if (!row.status_label) continue;
  assert.doesNotMatch(row.status_label, forbiddenLabels);
}

console.log('[test-festival-copy] All festival tone assertions passed.');
