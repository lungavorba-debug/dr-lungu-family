import type { ScreeningExtractionResult, VoiceScreeningExtractionResult } from '@medscreen/types';
import { parseAiExtractionPayload } from '../extraction-schema';
import { parseVoiceScreeningPayload } from '../voice-screening-extraction-schema';
import { extractScreeningFieldsHeuristic } from '../heuristic-extractor';
import { createEmptyVoiceScreeningExtraction, extractVoiceScreeningFieldsHeuristic } from '../voice-screening-heuristic';
import type {
  AiScreeningProvider,
  AiTranscriptionInput,
  AiTranscriptionResult,
  ResolvedAiConfig,
} from '../types';

export class HeuristicAiScreeningProvider implements AiScreeningProvider {
  readonly id = 'heuristic' as const;

  supportsTranscription(): boolean {
    return false;
  }

  supportsExtraction(): boolean {
    return true;
  }

  async transcribe(_input: AiTranscriptionInput): Promise<AiTranscriptionResult> {
    throw new Error('Heuristic provider does not support transcription.');
  }

  async extract(transcript: string): Promise<ScreeningExtractionResult> {
    return extractScreeningFieldsHeuristic(transcript);
  }

  async extractVoiceScreening(transcript: string): Promise<VoiceScreeningExtractionResult> {
    return extractVoiceScreeningFieldsHeuristic(transcript);
  }
}

export function buildExtractionResult(
  providerId: ResolvedAiConfig['provider_id'] | 'heuristic',
  model: string,
  payload: unknown,
): ScreeningExtractionResult {
  const parsed = parseAiExtractionPayload(payload);
  const fields: ScreeningExtractionResult['fields'] = {};

  for (const [key, entry] of Object.entries(parsed)) {
    fields[key as keyof ScreeningExtractionResult['fields']] = {
      value: entry.value,
      confidence: entry.confidence,
      source: 'ai',
      source_sentence: entry.source_sentence ?? null,
    };
  }

  if (!Object.keys(fields).length) {
    return extractScreeningFieldsHeuristic(typeof payload === 'string' ? payload : '');
  }

  return {
    fields,
    provider_id: providerId,
    model,
    extracted_at: new Date().toISOString(),
  };
}

export function buildVoiceExtractionResult(
  providerId: ResolvedAiConfig['provider_id'] | 'heuristic',
  model: string,
  payload: unknown,
): VoiceScreeningExtractionResult {
  const parsed = parseVoiceScreeningPayload(payload);
  const fields: VoiceScreeningExtractionResult['fields'] = {};

  for (const [key, entry] of Object.entries(parsed)) {
    fields[key as keyof VoiceScreeningExtractionResult['fields']] = {
      value: entry.value,
      confidence: entry.confidence,
      source: 'ai',
      source_sentence: entry.source_sentence ?? null,
    };
  }

  if (!Object.keys(fields).length) {
    if (typeof payload === 'string' && payload.trim()) {
      return extractVoiceScreeningFieldsHeuristic(payload);
    }
    return createEmptyVoiceScreeningExtraction();
  }

  return {
    fields,
    provider_id: providerId,
    model,
    extracted_at: new Date().toISOString(),
  };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function fetchJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as T;
}
