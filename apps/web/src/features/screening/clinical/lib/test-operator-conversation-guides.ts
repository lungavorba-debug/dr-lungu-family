import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { ClinicalWarning } from '@medscreen/types';

import {
  getGuideForFactor,
  getGuideForWarning,
  getOperatorConversationGuide,
  OPERATOR_CONVERSATION_GUIDES,
  resolveGuideKeyFromFactor,
  resolveGuideKeyFromWarning,
} from './operator-conversation-guide-copy';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tipComponentSource = readFileSync(
  join(__dirname, '../components/OperatorConversationTip.tsx'),
  'utf8',
);

assert.ok(!tipComponentSource.includes('<details'), 'Conversation tip must not use expandable details');
assert.ok(!/apas[aă] pentru/i.test(tipComponentSource), 'Conversation tip must not require extra tap');
assert.ok(tipComponentSource.includes('Spuneți participantului'), 'Conversation tip shows spoken line label');

const ALL_KEYS = Object.keys(OPERATOR_CONVERSATION_GUIDES);

assert.equal(ALL_KEYS.length, 11, 'Expected 11 operator conversation guides');

for (const key of ALL_KEYS) {
  const text = getOperatorConversationGuide(key as keyof typeof OPERATOR_CONVERSATION_GUIDES);
  assert.ok(text.length > 40, `Guide ${key} should be substantive`);
}

assert.equal(resolveGuideKeyFromFactor('Tensiune sistolică ≥ 140 mmHg'), 'high_blood_pressure');
assert.equal(resolveGuideKeyFromFactor('Glicemie post ≥ 126 mg/dL'), 'high_glucose');
assert.equal(resolveGuideKeyFromFactor('Fumător activ'), 'smoking');
assert.equal(resolveGuideKeyFromFactor('Diabet cunoscut (raportat)'), 'known_diabetes');
assert.equal(resolveGuideKeyFromFactor('Sforăit raportat'), 'snoring');
assert.equal(resolveGuideKeyFromFactor('Dispnee raportată'), 'dyspnea');
assert.equal(resolveGuideKeyFromFactor('Durere toracică raportată'), 'chest_pain');
assert.equal(resolveGuideKeyFromFactor('IMC ≥ 30'), 'bmi');

const pulseWarning: ClinicalWarning = {
  code: 'measurement_pulse',
  message: 'Valoare neobișnuită',
  severity: 'attention',
  source_field: 'pulse',
};
assert.equal(resolveGuideKeyFromWarning(pulseWarning), 'abnormal_pulse');
assert.ok(getGuideForWarning(pulseWarning)?.includes('Puls'));

const spo2Warning: ClinicalWarning = {
  code: 'operator_low_spo2',
  message: 'Saturație scăzută',
  severity: 'attention',
  source_field: 'oxygen_saturation',
};
assert.equal(resolveGuideKeyFromWarning(spo2Warning), 'low_spo2');
assert.ok(getGuideForFactor('Tensiune diastolică ≥ 90 mmHg')?.startsWith('Stați liniștit'));

console.log('[test-operator-conversation-guides] All assertions passed.');
