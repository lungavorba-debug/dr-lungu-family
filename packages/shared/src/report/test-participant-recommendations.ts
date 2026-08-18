import {
  buildPersonalizedParticipantRecommendations,
  recommendationMessagesAreUnique,
} from './participant-recommendations.ts';
import { containsEnglish } from './report-personalization.ts';

function assert(name: string, ok: boolean, detail = '') {
  console.log(`REC: ${name}`, ok ? 'PASS' : 'FAIL', detail);
  if (!ok) {
    process.exitCode = 1;
  }
}

const baseMeasurements = {
  systolic_bp: 120,
  diastolic_bp: 80,
  pulse: 72,
  oxygen_saturation: 98,
  blood_glucose: 90,
  blood_glucose_status: 'fasting' as const,
  weight_kg: 75,
  height_cm: 175,
  bmi: 24.5,
  ideal_weight_kg: 70.7,
  waist_circumference_cm: 88,
  known_hypertension: false,
  known_diabetes: false,
  current_antihypertensive_treatment: false,
};

const baseAnamnesis = {
  smoking_status: 'never' as const,
  alcohol_consumption: 'none' as const,
  known_diabetes: false,
  chest_pain: false,
  dyspnea: false,
  snoring: false,
  current_treatment: '',
  free_notes: '',
};

function allMessages(recommendations: ReturnType<typeof buildPersonalizedParticipantRecommendations>) {
  return recommendations.map((rec) => rec.message);
}

const healthy = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('healthy participant gets congratulations', healthy.some((rec) => rec.code === 'healthy_congratulations'));
assert('healthy participant has no BP recommendation', !healthy.some((rec) => rec.code.startsWith('bp_')));
assert('healthy messages are unique', recommendationMessagesAreUnique(healthy));

const elevatedBp = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, systolic_bp: 150, diastolic_bp: 95 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('elevated BP includes repeat monitoring', elevatedBp.some((rec) => rec.code === 'bp_repeat_monitoring'));
assert('elevated BP includes specialist referral', elevatedBp.some((rec) => rec.code === 'bp_specialist_referral'));
assert(
  'elevated BP monitoring mentions 5-7 days',
  allMessages(elevatedBp).some((message) => message.includes('5–7 zile')),
);

const urgentBp = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, systolic_bp: 190, diastolic_bp: 115 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('urgent BP uses urgent priority', urgentBp.some((rec) => rec.code === 'bp_urgent_evaluation' && rec.priority === 'urgent'));

const elevatedGlucose = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, blood_glucose: 112, blood_glucose_status: 'fasting' },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('elevated glucose includes HbA1c guidance', elevatedGlucose.some((rec) => rec.code === 'glucose_repeat_testing'));
assert('normal glucose skips diabetes recommendation', !healthy.some((rec) => rec.code.startsWith('glucose_')));

const knownDiabetes = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, blood_glucose: 90 },
  anamnesis: { ...baseAnamnesis, known_diabetes: true },
  participant: { gender: 'M' },
});

assert('known diabetes gets follow-up recommendation', knownDiabetes.some((rec) => rec.code === 'known_diabetes_follow_up'));

const elevatedBmi = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, bmi: 28.5 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('elevated BMI recommends lifestyle', elevatedBmi.some((rec) => rec.code === 'bmi_lifestyle'));

const elevatedWaist = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, waist_circumference_cm: 102 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('elevated waist recommends lifestyle', elevatedWaist.some((rec) => rec.code === 'waist_lifestyle'));

const currentSmoker = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: { ...baseAnamnesis, smoking_status: 'current' },
  participant: { gender: 'M' },
});

assert('current smoker gets cessation recommendation', currentSmoker.some((rec) => rec.code === 'smoking_cessation'));
assert('never smoker gets no smoking recommendation', !healthy.some((rec) => rec.code.startsWith('smoking_')));

const formerSmoker = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: { ...baseAnamnesis, smoking_status: 'former' },
  participant: { gender: 'M' },
});

assert('former smoker gets abstinence encouragement', formerSmoker.some((rec) => rec.code === 'smoking_abstinence'));

const snoring = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: { ...baseAnamnesis, snoring: true },
  participant: { gender: 'M' },
});

assert('snoring recommends sleep evaluation', snoring.some((rec) => rec.code === 'snoring_sleep_evaluation'));

const chestPain = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: { ...baseAnamnesis, chest_pain: true },
  participant: { gender: 'M' },
});

assert('chest pain is urgent', chestPain.some((rec) => rec.code === 'chest_pain_evaluation' && rec.priority === 'urgent'));

const dyspnea = buildPersonalizedParticipantRecommendations({
  measurements: baseMeasurements,
  anamnesis: { ...baseAnamnesis, dyspnea: true },
  participant: { gender: 'M' },
});

assert('dyspnea recommends prompt evaluation', dyspnea.some((rec) => rec.code === 'dyspnea_evaluation'));

const lowSpo2 = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, oxygen_saturation: 92 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('low spo2 recommends evaluation', lowSpo2.some((rec) => rec.code === 'spo2_evaluation'));

const highPulse = buildPersonalizedParticipantRecommendations({
  measurements: { ...baseMeasurements, pulse: 110 },
  anamnesis: baseAnamnesis,
  participant: { gender: 'M' },
});

assert('high pulse recommends evaluation', highPulse.some((rec) => rec.code === 'pulse_evaluation'));

const allScenarios = [
  ...healthy,
  ...elevatedBp,
  ...urgentBp,
  ...elevatedGlucose,
  ...knownDiabetes,
  ...elevatedBmi,
  ...elevatedWaist,
  ...currentSmoker,
  ...formerSmoker,
  ...snoring,
  ...chestPain,
  ...dyspnea,
  ...lowSpo2,
  ...highPulse,
];

assert(
  'no english in recommendation messages',
  allScenarios.every((rec) => !containsEnglish(rec.message)),
);
assert(
  'no demo wording in recommendation messages',
  allScenarios.every((rec) => !/\bdemo\b|\[DEMO\]/i.test(rec.message)),
);

if (process.exitCode === 1) {
  throw new Error('Participant recommendation tests failed');
}

console.log('Participant recommendation tests completed successfully.');
