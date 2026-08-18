import type { AiProviderId, AiSettings, ScreeningExtractionResult, VoiceScreeningExtractionResult } from '@medscreen/types';

export interface ResolvedAiConfig {
  enabled: boolean;
  provider_id: AiProviderId;
  model: string;
  transcription_model: string;
  api_key: string;
  api_base_url: string | null;
  deployment_name: string | null;
}

export interface AiTranscriptionInput {
  audio_base64: string;
  mime: string;
}

export interface AiTranscriptionResult {
  text: string;
}

export interface AiScreeningProvider {
  readonly id: AiProviderId | 'heuristic';
  transcribe(input: AiTranscriptionInput): Promise<AiTranscriptionResult>;
  extract(transcript: string): Promise<ScreeningExtractionResult>;
  extractVoiceScreening(transcript: string): Promise<VoiceScreeningExtractionResult>;
  supportsTranscription(): boolean;
  supportsExtraction(): boolean;
}

export interface AiProviderDefinition {
  id: AiProviderId;
  create(config: ResolvedAiConfig): AiScreeningProvider;
  isConfigured(config: ResolvedAiConfig): boolean;
}

export function normalizeAiSettings(
  ai: Partial<AiSettings> & { openai_api_key?: string },
): AiSettings {
  const legacyKey = typeof ai.openai_api_key === 'string' ? ai.openai_api_key : '';
  const apiKey = ai.api_key?.trim() ? ai.api_key : legacyKey;

  return {
    enabled: ai.enabled ?? false,
    provider: ai.provider ?? 'none',
    model: ai.model?.trim() ? ai.model : 'gpt-4o-mini',
    transcription_model: ai.transcription_model ?? null,
    api_key: apiKey ?? '',
    api_base_url: ai.api_base_url ?? null,
    deployment_name: ai.deployment_name ?? null,
  };
}

export function resolveAiConfig(ai: AiSettings): ResolvedAiConfig {
  const normalized = normalizeAiSettings(ai);
  const transcriptionModel =
    normalized.transcription_model?.trim() ||
    (normalized.provider === 'openai' || normalized.provider === 'azure_openai'
      ? 'whisper-1'
      : normalized.model);

  return {
    enabled: normalized.enabled,
    provider_id: normalized.provider,
    model: normalized.model,
    transcription_model: transcriptionModel,
    api_key: normalized.api_key,
    api_base_url: normalized.api_base_url,
    deployment_name: normalized.deployment_name,
  };
}

export function isAiProviderConfigured(config: ResolvedAiConfig): boolean {
  if (!config.enabled || config.provider_id === 'none') {
    return false;
  }
  if (!config.api_key.trim()) {
    return false;
  }
  if (config.provider_id === 'azure_openai') {
    return Boolean(config.api_base_url?.trim() && config.deployment_name?.trim());
  }
  if (config.provider_id === 'gemini') {
    return Boolean(config.model.trim());
  }
  return Boolean(config.model.trim());
}
