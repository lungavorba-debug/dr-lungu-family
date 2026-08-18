/**
 * Run: npx tsx apps/web/src/features/screening/test-ai-production-guards.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  countMeaningfulSpokenWords,
  createEmptyScreeningExtraction,
  hasExtractableFields,
  hasMeaningfulSpokenTranscript,
} from '../../../../../packages/shared/src/ai/transcript-validation.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

function read(relativePath: string): string {
  return readFileSync(join(__dirname, relativePath), 'utf8');
}

function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok: ${name}`);
}

console.log('AI production guards');

test('fewer than five words are not meaningful', () => {
  assert.equal(hasMeaningfulSpokenTranscript('da nu poate'), false);
  assert.equal(countMeaningfulSpokenWords('da nu poate'), 3);
});

test('five or more words are meaningful', () => {
  assert.equal(hasMeaningfulSpokenTranscript('Pacientul spune ca nu fumeaza deloc'), true);
});

test('empty extraction has no fields', () => {
  assert.equal(hasExtractableFields(createEmptyScreeningExtraction()), false);
});

const providersSource = read('conversation/providers/index.ts');
const orchestratorSource = read('conversation/services/conversation-orchestrator.ts');
const anamnesisHookSource = read('conversation/hooks/useScreeningAnamnesis.ts');
const apiSource = read('../../../../../apps/api/src/application/ai-screening/ai-screening.use-cases.ts');

test('production providers disable demo capture by default', () => {
  assert.match(providersSource, /demoCaptureEnabled:\s*false/);
  assert.match(providersSource, /isProductionRuntime\(\)/);
});

test('demo providers enable capture only in test helper', () => {
  assert.match(providersSource, /createConversationProviders\(\)[\s\S]*demoCaptureEnabled:\s*true/);
});

test('orchestrator checks meaningful transcript before extraction', () => {
  assert.match(orchestratorSource, /hasMeaningfulSpokenTranscript/);
  assert.match(orchestratorSource, /hasSuccessfulTranscription/);
  assert.match(orchestratorSource, /Nu s-au detectat informații medicale/);
  assert.match(orchestratorSource, /demoCaptureEnabled/);
});

test('anamnesis hook blocks empty extraction and shows empty transcript message', () => {
  assert.match(anamnesisHookSource, /hasExtractableFields/);
  assert.match(anamnesisHookSource, /Nu s-au detectat informații medicale/);
  assert.match(anamnesisHookSource, /emptyTranscript/);
});

test('api extraction skips short transcripts and production heuristics', () => {
  assert.match(apiSource, /hasMeaningfulSpokenTranscript/);
  assert.match(apiSource, /process\.env\.NODE_ENV === 'production'/);
  assert.match(apiSource, /createEmptyScreeningExtraction/);
});

console.log('AI production guards passed');
