import type {
  CompleteScreeningRequest,
  MedicalMeasurements,
  SaveMeasurementsRequest,
  ScreeningSyncPdfMetadata,
  ScreeningSyncQueueItem,
  SyncQueueStatus,
} from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';
import {
  getLastSuccessfulSyncAt,
  setLastSuccessfulSyncAt,
  upsertSyncQueueItem,
} from '../lib/sync-queue-storage';
import { isApiUnavailableError } from '../lib/sync-utils';

export interface EnqueueScreeningSyncInput {
  screeningId: string;
  userId: string;
  campaignId: string;
  patientId: string;
  patientName: string;
  operatorName: string;
  measurements: MedicalMeasurements;
  completePayload: CompleteScreeningRequest;
  pdfMetadata: ScreeningSyncPdfMetadata;
  measurementsSavedOnServer?: boolean;
  saveMeasurementsPayload?: SaveMeasurementsRequest | null;
}

export interface SyncItemResult {
  itemId: string;
  status: SyncQueueStatus;
  errorMessage?: string;
}

export async function enqueueScreeningSync(
  input: EnqueueScreeningSyncInput,
): Promise<ScreeningSyncQueueItem> {
  const now = new Date().toISOString();
  const item: ScreeningSyncQueueItem = {
    id: `${input.screeningId}-${Date.now()}`,
    screening_id: input.screeningId,
    user_id: input.userId,
    campaign_id: input.campaignId,
    patient_id: input.patientId,
    patient_name: input.patientName,
    operator_name: input.operatorName,
    queued_at: now,
    updated_at: now,
    last_attempt_at: null,
    last_error: null,
    attempt_count: 0,
    status: 'pending',
    measurements_saved_on_server: input.measurementsSavedOnServer ?? true,
    save_measurements_payload: input.saveMeasurementsPayload ?? null,
    measurements: input.measurements,
    complete_payload: input.completePayload,
    pdf_metadata: input.pdfMetadata,
  };

  await upsertSyncQueueItem(item);
  return item;
}

async function syncSingleItem(item: ScreeningSyncQueueItem): Promise<SyncItemResult> {
  const now = new Date().toISOString();
  const syncingItem: ScreeningSyncQueueItem = {
    ...item,
    status: 'syncing',
    updated_at: now,
    last_attempt_at: now,
    attempt_count: item.attempt_count + 1,
  };
  await upsertSyncQueueItem(syncingItem);

  try {
    const status = await apiClient.getScreeningSyncStatus(item.screening_id);

    if (status.conflict) {
      const conflictItem: ScreeningSyncQueueItem = {
        ...syncingItem,
        status: 'conflict',
        updated_at: new Date().toISOString(),
        last_error: status.conflict_reason ?? 'Conflict de sincronizare detectat.',
      };
      await upsertSyncQueueItem(conflictItem);
      return {
        itemId: item.id,
        status: 'conflict',
        errorMessage: conflictItem.last_error ?? undefined,
      };
    }

    if (status.exists && status.status === 'completed') {
      const syncedItem: ScreeningSyncQueueItem = {
        ...syncingItem,
        status: 'synced',
        updated_at: new Date().toISOString(),
        last_error: null,
      };
      await upsertSyncQueueItem(syncedItem);
      return { itemId: item.id, status: 'synced' };
    }

    if (!status.exists && item.save_measurements_payload) {
      await apiClient.saveMeasurements(item.save_measurements_payload);
    } else if (!status.exists && !item.measurements_saved_on_server) {
      await apiClient.saveMeasurements({
        campaign_id: item.campaign_id,
        patient_id: item.patient_id,
        measurements: item.measurements,
      });
    }

    await apiClient.completeScreening(item.screening_id, item.complete_payload);

    const syncedItem: ScreeningSyncQueueItem = {
      ...syncingItem,
      status: 'synced',
      updated_at: new Date().toISOString(),
      last_error: null,
    };
    await upsertSyncQueueItem(syncedItem);
    return { itemId: item.id, status: 'synced' };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Sincronizarea screeningului a eșuat.';
    const failedStatus: SyncQueueStatus = isApiUnavailableError(error) ? 'pending' : 'failed';
    const failedItem: ScreeningSyncQueueItem = {
      ...syncingItem,
      status: failedStatus,
      updated_at: new Date().toISOString(),
      last_error: message,
    };
    await upsertSyncQueueItem(failedItem);
    return {
      itemId: item.id,
      status: failedStatus,
      errorMessage: message,
    };
  }
}

export async function syncQueueItems(
  items: ScreeningSyncQueueItem[],
  onProgress?: (current: number, total: number, activeScreeningId: string | null) => void,
): Promise<SyncItemResult[]> {
  const actionable = items.filter(
    (item) => item.status === 'pending' || item.status === 'failed',
  );
  const results: SyncItemResult[] = [];

  for (let index = 0; index < actionable.length; index += 1) {
    const item = actionable[index]!;
    onProgress?.(index + 1, actionable.length, item.screening_id);
    const result = await syncSingleItem(item);
    results.push(result);
  }

  onProgress?.(actionable.length, actionable.length, null);

  if (results.some((result) => result.status === 'synced')) {
    setLastSuccessfulSyncAt(new Date().toISOString());
  }

  return results;
}

export function readLastSuccessfulSyncAt(): string | null {
  return getLastSuccessfulSyncAt();
}
