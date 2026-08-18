import type { AiProviderId } from './clinic-settings';

export type ScreeningExtractionFieldName =
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'age'
  | 'gender'
  | 'city'
  | 'chief_complaint'
  | 'symptoms'
  | 'medical_history'
  | 'medications'
  | 'allergies'
  | 'smoking_status'
  | 'alcohol_consumption'
  | 'family_history'
  | 'lifestyle'
  | 'risk_factors'
  | 'known_diabetes'
  | 'known_hypertension'
  | 'chest_pain'
  | 'dyspnea'
  | 'snoring'
  | 'current_treatment'
  | 'free_notes';

export interface ScreeningFieldExtraction<T = unknown> {
  value: T;
  confidence: number;
  source: 'ai' | 'heuristic';
  source_sentence?: string | null;
}

export type ScreeningExtractionFields = Partial<
  Record<ScreeningExtractionFieldName, ScreeningFieldExtraction>
>;

export interface ScreeningExtractionResult {
  fields: ScreeningExtractionFields;
  provider_id: AiProviderId | 'heuristic';
  model: string;
  extracted_at: string;
}

export interface TranscriptSegmentRecord {
  id: string;
  text: string;
  timestamp: number;
  source: 'operator' | 'participant' | 'system';
}

export type ScreeningAiSessionStatus = 'draft' | 'active' | 'review' | 'completed';

export interface OperatorFieldReview {
  field: ScreeningExtractionFieldName;
  accepted: boolean;
  reviewed_at: string;
}

export interface ScreeningAiSessionRecord {
  id: string;
  operator_id: string;
  campaign_id: string | null;
  screening_id: string | null;
  status: ScreeningAiSessionStatus;
  transcript: TranscriptSegmentRecord[];
  extraction: ScreeningExtractionResult | null;
  operator_review: OperatorFieldReview[];
  provider_id: AiProviderId | 'heuristic' | null;
  created_at: string;
  updated_at: string;
}

export interface AiAvailabilityResponse {
  available: boolean;
  provider: AiProviderId | null;
  transcription_supported: boolean;
  extraction_supported: boolean;
}

export interface CreateScreeningAiSessionRequest {
  campaign_id?: string | null;
}

export interface SyncTranscriptRequest {
  segments: TranscriptSegmentRecord[];
}

export interface TranscribeAudioRequest {
  audio_base64: string;
  mime: string;
}

export interface TranscribeAudioResponse {
  text: string;
  segment: TranscriptSegmentRecord | null;
}

export interface ExtractScreeningRequest {
  transcript?: string;
}

export interface ReviewScreeningExtractionRequest {
  reviews: OperatorFieldReview[];
}

export type VoiceScreeningFieldName =
  | 'first_name'
  | 'last_name'
  | 'phone'
  | 'age'
  | 'gender'
  | 'city'
  | 'systolic_bp'
  | 'diastolic_bp'
  | 'pulse'
  | 'blood_glucose'
  | 'cholesterol_mg_dl'
  | 'waist_circumference_cm'
  | 'weight_kg'
  | 'height_cm'
  | 'smoking_status'
  | 'medical_history'
  | 'known_hypertension'
  | 'known_diabetes'
  | 'chest_pain'
  | 'dyspnea'
  | 'snoring'
  | 'current_treatment';

export interface VoiceScreeningFieldExtraction<T = unknown> {
  value: T;
  confidence: number;
  source: 'ai' | 'heuristic';
  source_sentence?: string | null;
}

export type VoiceScreeningExtractionFields = Partial<
  Record<VoiceScreeningFieldName, VoiceScreeningFieldExtraction>
>;

export interface VoiceScreeningExtractionResult {
  fields: VoiceScreeningExtractionFields;
  provider_id: AiProviderId | 'heuristic' | 'none';
  model: string;
  extracted_at: string;
}

export interface ParseScreeningVoiceRequest {
  audio_base64: string;
  mime: string;
}

export interface ParseScreeningVoiceResponse {
  transcript: string;
  extraction: VoiceScreeningExtractionResult;
}
