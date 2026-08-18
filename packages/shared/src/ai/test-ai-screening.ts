/**
 * Run: npm run test:ai-screening
 */
import assert from 'node:assert/strict';
import {
  createAiScreeningProvider,
  createEmptyScreeningExtraction,
  extractScreeningFieldsHeuristic,
  hasExtractableFields,
  hasMeaningfulSpokenTranscript,
  isRemoteAiProviderAvailable,
  normalizeAiSettings,
  resolveAiConfig,
} from './index';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
  } catch (error) {
    console.error(`  ✗ ${name}`);
    throw error;
  }
}

test('normalizeAiSettings maps legacy openai_api_key', () => {
  const normalized = normalizeAiSettings({
    enabled: true,
    provider: 'openai',
    model: 'gpt-4o-mini',
    openai_api_key: 'sk-test',
  });
  assert.equal(normalized.api_key, 'sk-test');
});

test('heuristic extractor parses phone and age', () => {
  const result = extractScreeningFieldsHeuristic(
    'Pacientul Ion Popescu, telefon 0722123456, 45 ani, masculin, Pitești, fumător.',
  );
  assert.equal(result.fields.phone?.value, '0722123456');
  assert.equal(result.fields.age?.value, '45');
  assert.equal(result.fields.gender?.value, 'M');
  assert.equal(result.provider_id, 'heuristic');
});

test('remote provider unavailable without api key', () => {
  const config = resolveAiConfig(
    normalizeAiSettings({
      enabled: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      api_key: '',
      transcription_model: null,
      api_base_url: null,
      deployment_name: null,
    }),
  );
  assert.equal(isRemoteAiProviderAvailable(config), false);
  assert.equal(createAiScreeningProvider(config).id, 'heuristic');
});

test('remote provider available with openai config', () => {
  const config = resolveAiConfig(
    normalizeAiSettings({
      enabled: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
      api_key: 'sk-test',
      transcription_model: 'whisper-1',
      api_base_url: null,
      deployment_name: null,
    }),
  );
  assert.equal(isRemoteAiProviderAvailable(config), true);
  assert.equal(createAiScreeningProvider(config).id, 'openai');
});

test('meaningful transcript requires at least five words', () => {
  assert.equal(hasMeaningfulSpokenTranscript('un doi trei'), false);
  assert.equal(hasMeaningfulSpokenTranscript('pacientul nu fumeaza deloc niciodata'), true);
});

test('empty extraction contains no fields', () => {
  assert.equal(hasExtractableFields(createEmptyScreeningExtraction()), false);
});

console.log('AI screening shared tests passed.');
