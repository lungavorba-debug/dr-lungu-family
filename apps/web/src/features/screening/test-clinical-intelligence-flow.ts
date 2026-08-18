import assert from 'node:assert/strict';

import {

  buildClinicalSummary,

  getMissingAnamnesisTopics,

  mergeAnamnesisExtractionClinical,

  sanitizeClinicalNotes,

  shouldShowCoverageChecklist,

  valuesConflict,

} from './conversation/lib/clinical-intelligence.ts';

import { createEmptyAnamnesisForm } from './conversation/types/anamnesis-form.ts';



function test(name: string, fn: () => void) {

  try {

    fn();

    console.log(`  ✓ ${name}`);

  } catch (error) {

    console.error(`  ✗ ${name}`);

    throw error;

  }

}



test('valuesConflict detects smoking change', () => {

  assert.equal(valuesConflict('never', 'current'), true);

  assert.equal(valuesConflict('never', 'never'), false);

});



test('merge does not overwrite on contradiction', () => {

  const form = { ...createEmptyAnamnesisForm(), smoking_status: 'never' as const };

  const result = mergeAnamnesisExtractionClinical(

    form,

    {

      fields: {

        smoking_status: {

          value: 'current',

          confidence: 0.9,

          source: 'ai',

          source_sentence: 'Fumez un pachet pe zi.',

        },

      },

      provider_id: 'heuristic',

      model: 'test',

      extracted_at: new Date().toISOString(),

    },

    new Set(),

  );

  assert.equal(result.form.smoking_status, 'never');

  assert.equal(result.contradictions.length, 1);

});



test('merge ignores non-screening extraction fields', () => {

  const form = createEmptyAnamnesisForm();

  const result = mergeAnamnesisExtractionClinical(

    form,

    {

      fields: {

        allergies: {

          value: 'Penicilină',

          confidence: 0.95,

          source: 'ai',

        },

        known_diabetes: {

          value: true,

          confidence: 0.9,

          source: 'ai',

          source_sentence: 'Am diabet.',

        },

      },

      provider_id: 'heuristic',

      model: 'test',

      extracted_at: new Date().toISOString(),

    },

    new Set(),

  );

  assert.equal(result.form.allergies, '');

  assert.equal(result.form.known_diabetes, true);

});



test('manual locked fields are never overwritten', () => {

  const form = { ...createEmptyAnamnesisForm(), known_diabetes: true };

  const result = mergeAnamnesisExtractionClinical(

    form,

    {

      fields: {

        known_diabetes: {

          value: false,

          confidence: 0.95,

          source: 'ai',

        },

      },

      provider_id: 'heuristic',

      model: 'test',

      extracted_at: new Date().toISOString(),

    },

    new Set(['known_diabetes']),

  );

  assert.equal(result.form.known_diabetes, true);

  assert.equal(result.contradictions.length, 0);

});



test('clinical summary limited to eight bullets', () => {

  const form = {

    ...createEmptyAnamnesisForm(),

    known_hypertension: true,

    known_diabetes: true,

    smoking_status: 'current' as const,

    follows_treatment: true,

    current_treatment: 'pastile pentru tensiune',

    snoring: true,

  };

  const summary = buildClinicalSummary(form).split('\n');

  assert.ok(summary.length <= 8);

  assert.match(summary[0] ?? '', /^• /);

});



test('sanitizeClinicalNotes does not append during screening mode', () => {

  const form = {

    ...createEmptyAnamnesisForm(),

    free_notes: 'Notă existentă',

  };

  const notes = sanitizeClinicalNotes(form, 'Durere toracică de 2 zile la efort.');

  assert.equal(notes, 'Notă existentă');

});



test('missing topics checklist appears when interview paused', () => {

  const form = createEmptyAnamnesisForm();

  const missing = getMissingAnamnesisTopics(form);

  assert.ok(missing.length > 0);

  assert.equal(

    shouldShowCoverageChecklist({

      assistantStarted: true,

      interviewActive: false,

      missingTopicsCount: missing.length,

    }),

    true,

  );

});



console.log('Clinical intelligence tests passed.');


