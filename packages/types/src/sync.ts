import type { CompleteScreeningRequest } from './screening';
import type { MedicalMeasurements, SaveMeasurementsRequest } from './measurements';

export type SyncQueueStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export interface ScreeningSyncPdfMetadata {
  filename: string;
  mime_type: 'application/pdf';
  generated_at: string;
  byte_length: number;
  generator_version: number;
}

export interface ScreeningSyncQueueItem {
  id: string;
  screening_id: string;
  user_id: string;
  campaign_id: string;
  patient_id: string;
  patient_name: string;
  operator_name: string;
  queued_at: string;
  updated_at: string;
  last_attempt_at: string | null;
  last_error: string | null;
  attempt_count: number;
  status: SyncQueueStatus;
  measurements_saved_on_server: boolean;
  save_measurements_payload: SaveMeasurementsRequest | null;
  measurements: MedicalMeasurements;
  complete_payload: CompleteScreeningRequest;
  pdf_metadata: ScreeningSyncPdfMetadata;
}

export interface ScreeningSyncStatusResponse {
  screening_id: string;
  exists: boolean;
  status: string | null;
  completed_at: string | null;
  operator_id: string | null;
  can_accept_completion: boolean;
  conflict: boolean;
  conflict_reason: string | null;
}

export interface SyncProgressState {
  is_syncing: boolean;
  current: number;
  total: number;
  active_screening_id: string | null;
}

export interface SyncQueueSummary {
  pending: ScreeningSyncQueueItem[];
  synced: ScreeningSyncQueueItem[];
  failed: ScreeningSyncQueueItem[];
  conflict: ScreeningSyncQueueItem[];
  last_successful_sync_at: string | null;
  progress: SyncProgressState;
}
