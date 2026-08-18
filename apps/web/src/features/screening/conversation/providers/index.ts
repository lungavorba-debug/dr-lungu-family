import { apiClient } from '../../../../shared/lib/api-client';

import { ApiAiExtractionProvider } from './api-extraction.provider';

import { MediaRecorderSpeechProvider } from './media-recorder-speech.provider';

import { MockAiExtractionProvider } from './mock-extraction.provider';

import { MockSpeechProvider } from './mock-speech.provider';

import { MockTranscriptProvider } from './mock-transcript.provider';

import { NoOpExtractionProvider } from './noop-extraction.provider';

import type { ConversationProviders, TranscriptSegment } from '../types/providers';



let cachedProviders: ConversationProviders | null = null;

let initPromise: Promise<ConversationProviders> | null = null;



function isProductionRuntime(): boolean {

  return import.meta.env.PROD;

}



function createMockProviders(options?: { demoCaptureEnabled?: boolean }): ConversationProviders {

  return {

    speech: new MockSpeechProvider(),

    transcript: new MockTranscriptProvider(),

    extraction: new MockAiExtractionProvider(),

    mode: 'mock',

    sessionId: null,

    demoCaptureEnabled: options?.demoCaptureEnabled ?? false,

    operational: true,

  };

}



function createDisabledProductionProviders(): ConversationProviders {

  return {

    speech: new MediaRecorderSpeechProvider(),

    transcript: new MockTranscriptProvider(),

    extraction: new NoOpExtractionProvider(),

    mode: 'production',

    sessionId: null,

    demoCaptureEnabled: false,

    operational: false,

  };

}



async function createProductionProviders(campaignId?: string | null): Promise<ConversationProviders> {

  const availability = await apiClient.getAiAvailability();

  const session = await apiClient.createScreeningAiSession({ campaign_id: campaignId ?? null });

  const transcript = new MockTranscriptProvider();



  const syncTranscript = async (segments: TranscriptSegment[]) => {

    await apiClient.syncTranscript(session.id, { segments });

  };



  const transcribeRecording = async (blob: Blob) => {

    const audio_base64 = await blobToBase64(blob);

    const result = await apiClient.transcribeAudio(session.id, {

      audio_base64,

      mime: blob.type || 'audio/webm',

    });

    if (result.text.trim()) {

      transcript.append({

        text: result.text,

        source: 'participant',

      });

    }

  };



  const speech = new MediaRecorderSpeechProvider();

  if (!speech.isSupported || !availability.transcription_supported) {

    return createDisabledProductionProviders();

  }



  return {

    speech,

    transcript,

    extraction: new ApiAiExtractionProvider(session.id),

    mode: 'production',

    sessionId: session.id,

    syncTranscript,

    transcribeRecording,

    demoCaptureEnabled: false,

    operational: true,

  };

}



export async function initializeConversationProviders(

  campaignId?: string | null,

): Promise<ConversationProviders> {

  if (cachedProviders) {

    return cachedProviders;

  }



  if (!initPromise) {

    initPromise = (async () => {

      try {

        if (isProductionRuntime()) {

          const availability = await apiClient.getAiAvailability();

          if (!availability.available || !availability.transcription_supported) {

            cachedProviders = createDisabledProductionProviders();

          } else {

            cachedProviders = await createProductionProviders(campaignId);

          }

        } else {

          const availability = await apiClient.getAiAvailability();

          cachedProviders = availability.available

            ? await createProductionProviders(campaignId)

            : createMockProviders();

        }

      } catch {

        cachedProviders = isProductionRuntime()

          ? createDisabledProductionProviders()

          : createMockProviders();

      }

      return cachedProviders;

    })();

  }



  return initPromise;

}



export function getConversationProviders(): ConversationProviders {

  if (cachedProviders) {

    return cachedProviders;

  }

  if (isProductionRuntime()) {

    return createDisabledProductionProviders();

  }

  return createMockProviders();

}



export function resetConversationProviders(): void {

  cachedProviders = null;

  initPromise = null;

}



export function createConversationProviders(): ConversationProviders {

  return createMockProviders({ demoCaptureEnabled: true });

}



async function blobToBase64(blob: Blob): Promise<string> {

  const buffer = await blob.arrayBuffer();

  const bytes = new Uint8Array(buffer);

  let binary = '';

  for (const byte of bytes) {

    binary += String.fromCharCode(byte);

  }

  return btoa(binary);

}


