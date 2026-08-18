import type { ScreeningExtractionResult } from '@medscreen/types';

export type AiConversationStatus =
  | 'idle'
  | 'ready'
  | 'recording'
  | 'paused'
  | 'transcribing'
  | 'extracting'
  | 'completed';

export interface SpeechStartOptions {
  onChunk?: (blob: Blob) => void | Promise<void>;
  timesliceMs?: number;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  source: 'operator' | 'participant' | 'system';
}

export interface SpeechStopResult {
  audioBlob: Blob | null;
}

export interface SpeechProvider {
  readonly isSupported: boolean;
  readonly usesDemoCapture: boolean;
  start(options?: SpeechStartOptions): Promise<void>;
  pause?(): Promise<void>;
  resume?(): Promise<void>;
  stop(): Promise<SpeechStopResult>;
}

export interface TranscriptProvider {
  subscribe(listener: (segments: TranscriptSegment[]) => void): () => void;
  getSegments(): TranscriptSegment[];
  append(segment: Omit<TranscriptSegment, 'id' | 'timestamp'>): void;
  clear(): void;
}

export type ExtractedAnamnesisFields = Partial<import('./anamnesis-form').AnamnesisFormState>;

export interface ExtractionResult {
  fields: ExtractedAnamnesisFields;
  extraction: ScreeningExtractionResult;
}

export interface AiExtractionProvider {
  extract(transcript: string): Promise<ExtractionResult>;
}

export interface ConversationProviders {
  speech: SpeechProvider;
  transcript: TranscriptProvider;
  extraction: AiExtractionProvider;
  mode: 'mock' | 'production';
  sessionId: string | null;
  syncTranscript?(segments: TranscriptSegment[]): Promise<void>;
  transcribeRecording?(blob: Blob): Promise<void>;
  /** Demo transcript injection — enabled only in dedicated test helpers. */
  demoCaptureEnabled?: boolean;
  /** False when production runtime cannot reach a configured AI backend. */
  operational?: boolean;
}

export interface StopRecordingOutcome {
  extraction: ExtractionResult | null;
  emptyTranscript: boolean;
}

export interface AiFieldHint {
  aiFilled: boolean;
  lowConfidence: boolean;
  mediumConfidence: boolean;
  confirmed: boolean | null;
  confidence: number;
  sourceSentence?: string | null;
}

export type AiFieldHints = Partial<Record<import('./anamnesis-form').AnamnesisFormField, AiFieldHint>>;

export const LOW_CONFIDENCE_THRESHOLD = 0.65;
