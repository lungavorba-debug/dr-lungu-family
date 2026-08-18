import type { ScreeningExtractionResult } from '@medscreen/types';

const PLACEHOLDER_PATTERNS = [
  /^\(fără transcriere audio\)$/i,
  /^\(no audio transcription\)$/i,
];

export function normalizeSpokenTranscriptText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function countMeaningfulSpokenWords(text: string): number {
  const normalized = normalizeSpokenTranscriptText(text);
  if (!normalized) {
    return 0;
  }

  return normalized
    .split(' ')
    .map((word) => word.replace(/^[^a-zA-Z0-9À-ž]+|[^a-zA-Z0-9À-ž]+$/g, ''))
    .filter((word) => word.length > 0)
    .filter((word) => !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(word)))
    .length;
}

export const MIN_MEANINGFUL_SPOKEN_WORDS = 5;

export function hasMeaningfulSpokenTranscript(text: string): boolean {
  return countMeaningfulSpokenWords(text) >= MIN_MEANINGFUL_SPOKEN_WORDS;
}

export function createEmptyScreeningExtraction(): ScreeningExtractionResult {
  return {
    fields: {},
    provider_id: 'none',
    model: 'none',
    extracted_at: new Date().toISOString(),
  };
}

export function hasExtractableFields(extraction: ScreeningExtractionResult): boolean {
  return Object.values(extraction.fields).some((entry) => entry !== null && entry !== undefined);
}
