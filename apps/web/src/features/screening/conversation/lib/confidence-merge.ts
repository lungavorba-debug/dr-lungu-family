import type { ScreeningExtractionFieldName, ScreeningExtractionResult } from '@medscreen/types';
import type { AnamnesisFormField, AnamnesisFormState } from '../types/anamnesis-form';

export const HIGH_CONFIDENCE_THRESHOLD = 0.85;
export const MEDIUM_CONFIDENCE_THRESHOLD = 0.65;

export type ConfidenceTier = 'high' | 'medium' | 'low';

export function resolveConfidenceTier(confidence: number): ConfidenceTier {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return 'high';
  }
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return 'medium';
  }
  return 'low';
}

function isFieldEmpty(value: AnamnesisFormState[AnamnesisFormField]): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
}

function mapExtractionFieldToAnamnesis(
  field: ScreeningExtractionFieldName,
): AnamnesisFormField | null {
  const mapping: Partial<Record<ScreeningExtractionFieldName, AnamnesisFormField>> = {
    chief_complaint: 'chief_complaint',
    symptoms: 'symptoms',
    medical_history: 'medical_history',
    medications: 'medications',
    allergies: 'allergies',
    smoking_status: 'smoking_status',
    alcohol_consumption: 'alcohol_consumption',
    family_history: 'family_history',
    lifestyle: 'lifestyle',
    risk_factors: 'risk_factors',
    known_diabetes: 'known_diabetes',
    chest_pain: 'chest_pain',
    dyspnea: 'dyspnea',
    snoring: 'snoring',
    current_treatment: 'current_treatment',
    free_notes: 'free_notes',
  };
  return mapping[field] ?? null;
}

export function mergeAnamnesisExtraction(
  current: AnamnesisFormState,
  extraction: ScreeningExtractionResult,
  lockedFields: Set<AnamnesisFormField>,
): AnamnesisFormState {
  const next: AnamnesisFormState = { ...current };

  for (const [fieldName, entry] of Object.entries(extraction.fields)) {
    if (!entry) continue;

    const formField = mapExtractionFieldToAnamnesis(fieldName as ScreeningExtractionFieldName);
    if (!formField || lockedFields.has(formField)) {
      continue;
    }

    const tier = resolveConfidenceTier(entry.confidence);
    const currentValue = next[formField];
    const extractedValue = entry.value as AnamnesisFormState[AnamnesisFormField];

    if (extractedValue === undefined || extractedValue === null) {
      continue;
    }
    if (typeof extractedValue === 'string' && extractedValue.trim() === '') {
      continue;
    }

    if (tier === 'low') {
      if (!isFieldEmpty(currentValue)) {
        continue;
      }
    }

    if (tier === 'medium' && !isFieldEmpty(currentValue)) {
      continue;
    }

    (next as Record<AnamnesisFormField, AnamnesisFormState[AnamnesisFormField]>)[formField] =
      extractedValue;
  }

  return next;
}
