import type { AiProviderId } from '@medscreen/types';
import {
  SCREENING_EXTRACTION_JSON_SCHEMA,
  SCREENING_EXTRACTION_SYSTEM_PROMPT,
} from '../extraction-schema';
import {
  VOICE_SCREENING_EXTRACTION_JSON_SCHEMA,
  VOICE_SCREENING_EXTRACTION_SYSTEM_PROMPT,
} from '../voice-screening-extraction-schema';
import { buildExtractionResult, buildVoiceExtractionResult, fetchJson } from './heuristic.provider';
import type {
  AiScreeningProvider,
  AiTranscriptionInput,
  AiTranscriptionResult,
  ResolvedAiConfig,
} from '../types';

function whisperPrompt(): string {
  return 'Transcriere medicală în limba română. Conversație între medic și pacient la un screening de sănătate într-un festival cu zgomot de fundal. Ignorați muzica, vocile neimportante și zgomotul ambient. Prioritizați vocea pacientului care răspunde la întrebări medicale.';
}

function appendWhisperFormFields(form: FormData, config: ResolvedAiConfig): void {
  form.append('model', config.transcription_model);
  form.append('language', 'ro');
  form.append('prompt', whisperPrompt());
}

function stripBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

async function extractVoiceWithOpenAiChat(
  config: ResolvedAiConfig,
  providerId: AiProviderId,
  transcript: string,
  headers: Record<string, string>,
  url: string,
) {
  const body = {
    model: config.model,
    temperature: 0,
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'voice_screening_extraction',
        strict: true,
        schema: VOICE_SCREENING_EXTRACTION_JSON_SCHEMA,
      },
    },
    messages: [
      { role: 'system', content: VOICE_SCREENING_EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: transcript },
    ],
  };

  const response = await fetchJson<{
    choices?: Array<{ message?: { content?: string } }>;
  }>(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const content = response.choices?.[0]?.message?.content ?? '{}';
  const payload = JSON.parse(content) as unknown;
  return buildVoiceExtractionResult(providerId, config.model, payload);
}

export class OpenAiScreeningProvider implements AiScreeningProvider {
  readonly id: AiProviderId = 'openai';

  constructor(private readonly config: ResolvedAiConfig) {}

  supportsTranscription(): boolean {
    return true;
  }

  supportsExtraction(): boolean {
    return true;
  }

  async transcribe(input: AiTranscriptionInput): Promise<AiTranscriptionResult> {
    const buffer = Buffer.from(input.audio_base64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: input.mime }), 'recording.webm');
    appendWhisperFormFields(form, this.config);

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.api_key}`,
      },
      body: form,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'OpenAI transcription failed.');
    }

    const body = (await response.json()) as { text?: string };
    return { text: body.text?.trim() ?? '' };
  }

  async extract(transcript: string) {
    const body = {
      model: this.config.model,
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'screening_extraction',
          strict: true,
          schema: SCREENING_EXTRACTION_JSON_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: SCREENING_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
    };

    const response = await fetchJson<{
      choices?: Array<{ message?: { content?: string } }>;
    }>('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const content = response.choices?.[0]?.message?.content ?? '{}';
    const payload = JSON.parse(content) as unknown;
    return buildExtractionResult('openai', this.config.model, payload);
  }

  async extractVoiceScreening(transcript: string) {
    return extractVoiceWithOpenAiChat(
      this.config,
      'openai',
      transcript,
      { Authorization: `Bearer ${this.config.api_key}` },
      'https://api.openai.com/v1/chat/completions',
    );
  }
}

export class AzureOpenAiScreeningProvider implements AiScreeningProvider {
  readonly id: AiProviderId = 'azure_openai';

  constructor(private readonly config: ResolvedAiConfig) {}

  private chatUrl(): string {
    const base = stripBaseUrl(this.config.api_base_url ?? '');
    const deployment = this.config.deployment_name ?? this.config.model;
    return `${base}/openai/deployments/${deployment}/chat/completions?api-version=2024-06-01`;
  }

  private transcriptionUrl(): string {
    const base = stripBaseUrl(this.config.api_base_url ?? '');
    const deployment = this.config.transcription_model;
    return `${base}/openai/deployments/${deployment}/audio/transcriptions?api-version=2024-06-01`;
  }

  supportsTranscription(): boolean {
    return true;
  }

  supportsExtraction(): boolean {
    return true;
  }

  async transcribe(input: AiTranscriptionInput): Promise<AiTranscriptionResult> {
    const buffer = Buffer.from(input.audio_base64, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: input.mime }), 'recording.webm');
    appendWhisperFormFields(form, this.config);

    const response = await fetch(this.transcriptionUrl(), {
      method: 'POST',
      headers: {
        'api-key': this.config.api_key,
      },
      body: form,
    });

    if (!response.ok) {
      throw new Error(await response.text());
    }

    const body = (await response.json()) as { text?: string };
    return { text: body.text?.trim() ?? '' };
  }

  async extract(transcript: string) {
    const body = {
      temperature: 0.1,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'screening_extraction',
          strict: true,
          schema: SCREENING_EXTRACTION_JSON_SCHEMA,
        },
      },
      messages: [
        { role: 'system', content: SCREENING_EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
    };

    const response = await fetchJson<{
      choices?: Array<{ message?: { content?: string } }>;
    }>(this.chatUrl(), {
      method: 'POST',
      headers: {
        'api-key': this.config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const content = response.choices?.[0]?.message?.content ?? '{}';
    const payload = JSON.parse(content) as unknown;
    return buildExtractionResult('azure_openai', this.config.model, payload);
  }

  async extractVoiceScreening(transcript: string) {
    return extractVoiceWithOpenAiChat(
      this.config,
      'azure_openai',
      transcript,
      { 'api-key': this.config.api_key },
      this.chatUrl(),
    );
  }
}

export class GeminiScreeningProvider implements AiScreeningProvider {
  readonly id: AiProviderId = 'gemini';

  constructor(private readonly config: ResolvedAiConfig) {}

  supportsTranscription(): boolean {
    return true;
  }

  supportsExtraction(): boolean {
    return true;
  }

  async transcribe(input: AiTranscriptionInput): Promise<AiTranscriptionResult> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.config.transcription_model,
    )}:generateContent?key=${encodeURIComponent(this.config.api_key)}`;

    const body = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: input.mime,
                data: input.audio_base64,
              },
            },
            { text: `${whisperPrompt()} Returnează doar textul transcris.` },
          ],
        },
      ],
    };

    const response = await fetchJson<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text =
      response.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() ?? '';
    return { text };
  }

  async extract(transcript: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.config.model,
    )}:generateContent?key=${encodeURIComponent(this.config.api_key)}`;

    const body = {
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
      contents: [
        {
          parts: [
            { text: SCREENING_EXTRACTION_SYSTEM_PROMPT },
            { text: transcript },
          ],
        },
      ],
    };

    const response = await fetchJson<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const content = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const payload = JSON.parse(content) as unknown;
    return buildExtractionResult('gemini', this.config.model, payload);
  }

  async extractVoiceScreening(transcript: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      this.config.model,
    )}:generateContent?key=${encodeURIComponent(this.config.api_key)}`;

    const body = {
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
      },
      contents: [
        {
          parts: [
            { text: VOICE_SCREENING_EXTRACTION_SYSTEM_PROMPT },
            { text: transcript },
          ],
        },
      ],
    };

    const response = await fetchJson<{
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    }>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const content = response.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const payload = JSON.parse(content) as unknown;
    return buildVoiceExtractionResult('gemini', this.config.model, payload);
  }
}
