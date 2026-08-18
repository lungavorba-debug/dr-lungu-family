import type {
  ClinicalEngineInput,
  ClinicalEvaluationResult,
  MedicalMeasurements,
  Patient,
} from '@medscreen/types';
import type { ConversationAnamnesis } from '../context/ScreeningSessionContext';
import type { MeasurementsFormState } from '../measurements/types/measurements-form';
import {
  readWorkflowStorageItem,
  removeWorkflowStorageItem,
  writeWorkflowStorageItem,
} from './screening-workflow-storage';

const STORAGE_PREFIX = 'medscreen_screening_workflow:';
const STORAGE_VERSION = 2 as const;

export interface PersistedScreeningWorkflow {
  version: typeof STORAGE_VERSION;
  is_completed: boolean;
  activePatient: Patient;
  anamnesis: ConversationAnamnesis;
  aiSessionId?: string | null;
  measurements: MedicalMeasurements | null;
  clinicalEngineInput: ClinicalEngineInput | null;
  clinicalEvaluation: ClinicalEvaluationResult | null;
  measurementsDraft: MeasurementsFormState | null;
  updated_at: string;
}

type LegacyPersistedScreeningWorkflow = Omit<
  PersistedScreeningWorkflow,
  'version' | 'is_completed' | 'measurementsDraft'
> & {
  version: 1;
};

type StoredWorkflowSnapshot = Partial<PersistedScreeningWorkflow | LegacyPersistedScreeningWorkflow>;

export function persistScreeningWorkflow(
  userId: string,
  snapshot: Omit<PersistedScreeningWorkflow, 'version' | 'updated_at'>,
): void {
  if (!snapshot.activePatient || !snapshot.anamnesis) {
    return;
  }

  const payload: PersistedScreeningWorkflow = {
    version: STORAGE_VERSION,
    ...snapshot,
    updated_at: new Date().toISOString(),
  };

  writeWorkflowStorageItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(payload));
}

function normalizeSnapshot(raw: unknown): PersistedScreeningWorkflow | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const parsed = raw as StoredWorkflowSnapshot;

  if (parsed.version !== 1 && parsed.version !== STORAGE_VERSION) {
    return null;
  }

  if (!parsed.activePatient?.id || !parsed.anamnesis) {
    return null;
  }

  return {
    version: STORAGE_VERSION,
    is_completed: 'is_completed' in parsed ? Boolean(parsed.is_completed) : false,
    activePatient: parsed.activePatient,
    anamnesis: parsed.anamnesis,
    aiSessionId: parsed.aiSessionId ?? null,
    measurements: parsed.measurements ?? null,
    clinicalEngineInput: parsed.clinicalEngineInput ?? null,
    clinicalEvaluation: parsed.clinicalEvaluation ?? null,
    measurementsDraft: 'measurementsDraft' in parsed ? (parsed.measurementsDraft ?? null) : null,
    updated_at: parsed.updated_at ?? new Date().toISOString(),
  };
}

export function loadScreeningWorkflow(userId: string): PersistedScreeningWorkflow | null {
  const raw = readWorkflowStorageItem(`${STORAGE_PREFIX}${userId}`);
  if (!raw) return null;

  try {
    return normalizeSnapshot(JSON.parse(raw));
  } catch {
    clearScreeningWorkflow(userId);
    return null;
  }
}

export function markScreeningWorkflowCompleted(userId: string): void {
  const snapshot = loadScreeningWorkflow(userId);
  if (!snapshot) {
    return;
  }

  persistScreeningWorkflow(userId, {
    ...snapshot,
    is_completed: true,
  });
}

export function clearScreeningWorkflow(userId: string): void {
  removeWorkflowStorageItem(`${STORAGE_PREFIX}${userId}`);
}
