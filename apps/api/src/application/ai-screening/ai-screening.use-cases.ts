import { createAiScreeningProvider, createEmptyScreeningExtraction, createEmptyVoiceScreeningExtraction, extractScreeningFieldsHeuristic, extractVoiceScreeningFieldsHeuristic, hasMeaningfulSpokenTranscript } from '@medscreen/shared';
import type {
  AiAvailabilityResponse,
  CreateScreeningAiSessionRequest,
  ExtractScreeningRequest,
  ParseScreeningVoiceRequest,
  ParseScreeningVoiceResponse,
  ReviewScreeningExtractionRequest,
  ScreeningAiSessionRecord,
  ScreeningExtractionResult,
  SyncTranscriptRequest,
  TranscribeAudioRequest,
  TranscribeAudioResponse,
  TranscriptSegmentRecord,
  VoiceScreeningExtractionResult,
} from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';
import {
  mapSessionEntityToRecord,
  type ScreeningAiSessionRepository,
} from '../../domain/repositories/screening-ai-session.repository';

function createSegment(text: string, source: TranscriptSegmentRecord['source']): TranscriptSegmentRecord {
  return {
    id: crypto.randomUUID(),
    text,
    timestamp: Date.now(),
    source,
  };
}

async function getOwnedSession(
  repository: ScreeningAiSessionRepository,
  sessionId: string,
  operatorId: string,
) {
  const session = await repository.getById(sessionId);
  if (!session) {
    throw new AppError(404, 'AI_SESSION_NOT_FOUND', 'Sesiunea AI nu a fost găsită.');
  }
  if (session.operatorId !== operatorId) {
    throw new AppError(403, 'FORBIDDEN', 'Nu aveți acces la această sesiune AI.');
  }
  return session;
}

export class GetAiAvailabilityUseCase {
  constructor(private readonly resolver: ClinicSettingsResolver) {}

  async execute(): Promise<AiAvailabilityResponse> {
    const config = await this.resolver.getResolvedAiConfig();
    const provider = createAiScreeningProvider(config);
    const available = await this.resolver.isAiConfigured();

    return {
      available,
      provider: available ? config.provider_id : null,
      transcription_supported: available && provider.supportsTranscription(),
      extraction_supported: true,
    };
  }
}

export class CreateScreeningAiSessionUseCase {
  constructor(private readonly repository: ScreeningAiSessionRepository) {}

  async execute(
    operatorId: string,
    payload: CreateScreeningAiSessionRequest,
  ): Promise<ScreeningAiSessionRecord> {
    const session = await this.repository.create({
      operatorId,
      campaignId: payload.campaign_id ?? null,
    });
    return mapSessionEntityToRecord(session);
  }
}

export class GetScreeningAiSessionUseCase {
  constructor(private readonly repository: ScreeningAiSessionRepository) {}

  async execute(sessionId: string, operatorId: string): Promise<ScreeningAiSessionRecord> {
    const session = await getOwnedSession(this.repository, sessionId, operatorId);
    return mapSessionEntityToRecord(session);
  }
}

export class SyncTranscriptUseCase {
  constructor(private readonly repository: ScreeningAiSessionRepository) {}

  async execute(
    sessionId: string,
    operatorId: string,
    payload: SyncTranscriptRequest,
  ): Promise<ScreeningAiSessionRecord> {
    await getOwnedSession(this.repository, sessionId, operatorId);
    const updated = await this.repository.updateTranscript(sessionId, payload.segments);
    return mapSessionEntityToRecord(updated);
  }
}

export class TranscribeAudioUseCase {
  constructor(
    private readonly repository: ScreeningAiSessionRepository,
    private readonly resolver: ClinicSettingsResolver,
  ) {}

  async execute(
    sessionId: string,
    operatorId: string,
    payload: TranscribeAudioRequest,
  ): Promise<TranscribeAudioResponse> {
    const session = await getOwnedSession(this.repository, sessionId, operatorId);
    const config = await this.resolver.getResolvedAiConfig();
    const provider = createAiScreeningProvider(config);

    let text = '';
    if (await this.resolver.isAiConfigured()) {
      if (!provider.supportsTranscription()) {
        throw new AppError(400, 'AI_TRANSCRIPTION_UNSUPPORTED', 'Providerul AI nu suportă transcriere.');
      }
      const result = await provider.transcribe({
        audio_base64: payload.audio_base64,
        mime: payload.mime,
      });
      text = result.text.trim();
    }

    if (!text) {
      return { text: '', segment: null };
    }

    const segment = createSegment(text, 'participant');
    const transcript = [...session.transcript, segment];
    await this.repository.updateTranscript(sessionId, transcript);

    return { text, segment };
  }
}

export class ExtractScreeningUseCase {
  constructor(
    private readonly repository: ScreeningAiSessionRepository,
    private readonly resolver: ClinicSettingsResolver,
  ) {}

  async execute(
    sessionId: string,
    operatorId: string,
    payload: ExtractScreeningRequest = {},
  ): Promise<ScreeningExtractionResult> {
    const session = await getOwnedSession(this.repository, sessionId, operatorId);
    const transcript =
      payload.transcript ??
      session.transcript
        .filter((segment) => segment.source !== 'system')
        .map((segment) => segment.text)
        .join(' ')
        .trim();

    if (!hasMeaningfulSpokenTranscript(transcript)) {
      const empty = createEmptyScreeningExtraction();
      await this.repository.updateExtraction(sessionId, empty, null, 'review');
      return empty;
    }

    const config = await this.resolver.getResolvedAiConfig();
    let extraction: ScreeningExtractionResult;
    let providerId: string | null = 'heuristic';
    const isProduction = process.env.NODE_ENV === 'production';

    if (await this.resolver.isAiConfigured()) {
      const provider = createAiScreeningProvider(config);
      try {
        extraction = await provider.extract(transcript);
        providerId = provider.id;
      } catch {
        if (isProduction) {
          extraction = createEmptyScreeningExtraction();
          providerId = null;
        } else {
          extraction = extractScreeningFieldsHeuristic(transcript);
          providerId = 'heuristic';
        }
      }
    } else if (isProduction) {
      extraction = createEmptyScreeningExtraction();
      providerId = null;
    } else {
      extraction = extractScreeningFieldsHeuristic(transcript);
    }

    await this.repository.updateExtraction(sessionId, extraction, providerId, 'review');
    return extraction;
  }
}

export class ReviewScreeningExtractionUseCase {
  constructor(private readonly repository: ScreeningAiSessionRepository) {}

  async execute(
    sessionId: string,
    operatorId: string,
    payload: ReviewScreeningExtractionRequest,
  ): Promise<ScreeningAiSessionRecord> {
    await getOwnedSession(this.repository, sessionId, operatorId);
    const updated = await this.repository.updateReview(sessionId, payload.reviews, 'completed');
    return mapSessionEntityToRecord(updated);
  }
}

export class ParseScreeningVoiceUseCase {
  constructor(private readonly resolver: ClinicSettingsResolver) {}

  async execute(payload: ParseScreeningVoiceRequest): Promise<ParseScreeningVoiceResponse> {
    const config = await this.resolver.getResolvedAiConfig();
    const provider = createAiScreeningProvider(config);
    const isProduction = process.env.NODE_ENV === 'production';

    let transcript = '';
    if (await this.resolver.isAiConfigured()) {
      if (!provider.supportsTranscription()) {
        throw new AppError(400, 'AI_TRANSCRIPTION_UNSUPPORTED', 'Providerul AI nu suportă transcriere.');
      }
      const result = await provider.transcribe({
        audio_base64: payload.audio_base64,
        mime: payload.mime,
      });
      transcript = result.text.trim();
    }

    if (!hasMeaningfulSpokenTranscript(transcript)) {
      return {
        transcript,
        extraction: createEmptyVoiceScreeningExtraction(),
      };
    }

    let extraction: VoiceScreeningExtractionResult;

    if (await this.resolver.isAiConfigured()) {
      try {
        extraction = await provider.extractVoiceScreening(transcript);
      } catch {
        if (isProduction) {
          extraction = createEmptyVoiceScreeningExtraction();
        } else {
          extraction = extractVoiceScreeningFieldsHeuristic(transcript);
        }
      }
    } else if (isProduction) {
      extraction = createEmptyVoiceScreeningExtraction();
    } else {
      extraction = extractVoiceScreeningFieldsHeuristic(transcript);
    }

    return { transcript, extraction };
  }
}
