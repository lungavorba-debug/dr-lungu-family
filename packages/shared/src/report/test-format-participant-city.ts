import assert from 'node:assert/strict';

import { buildScreeningQuestionDisplayRows } from './build-screening-question-display';
import { formatParticipantCity, normalizeParticipantCityInput } from './format-participant-city';

assert.equal(formatParticipantCity('Ștrfănești'), 'Ștefănești');
assert.equal(formatParticipantCity('strfanesti'), 'Ștefănești');
assert.equal(normalizeParticipantCityInput('  pitesti '), 'Pitești');

const diabetesRows = buildScreeningQuestionDisplayRows({
  known_diabetes: true,
  diabetes_type: 'type2',
});

const diabetesRow = diabetesRows.find((row) => row.topic === 'Diabet cunoscut');
assert.ok(diabetesRow);
assert.equal(diabetesRow.answer, 'Da — Tip 2');

console.log('[test-format-participant-city] OK');
