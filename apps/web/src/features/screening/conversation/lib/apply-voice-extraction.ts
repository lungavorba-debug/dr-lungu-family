import { formatPhoneInput } from '@medscreen/shared';
import type { PatientGender, VoiceScreeningExtractionResult, VoiceScreeningFieldName } from '@medscreen/types';
import { resolveConfidenceTier } from './confidence-merge';
import { mapExtractedChestPain } from './screening-questions';
import type { AnamnesisFormField, AnamnesisFormState } from '../types/anamnesis-form';
import type { ConversationFormField, ConversationFormState } from '../types/conversation-form';
import type { AiFieldHint } from '../types/providers';
import type { MeasurementsFormState } from '../../measurements/types/measurements-form';

export type DemographicsFieldHints = Partial<Record<ConversationFormField, AiFieldHint>>;
export type MeasurementsFieldHints = Partial<Record<keyof MeasurementsFormState, AiFieldHint>>;
export type AnamnesisVoiceFieldHints = Partial<Record<AnamnesisFormField, AiFieldHint>>;

function buildHint(confidence: number, sourceSentence?: string | null): AiFieldHint {
  const tier = resolveConfidenceTier(confidence);
  return {
    aiFilled: true,
    lowConfidence: tier === 'low',
    mediumConfidence: tier === 'medium',
    confirmed: null,
    confidence,
    sourceSentence: sourceSentence ?? null,
  };
}

function isStringEmpty(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

function isNullableEmpty(value: unknown): boolean {
  return value === null || value === undefined;
}

function formatNumericField(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return '';
}

function normalizeGender(value: unknown): PatientGender | '' {
  if (value === 'M' || value === 'F') return value;
  const lower = String(value).toLowerCase();
  if (lower.startsWith('m') || lower.includes('mascul')) return 'M';
  if (lower.startsWith('f') || lower.includes('femin')) return 'F';
  return '';
}

function normalizeSmokingStatus(value: unknown): ConversationFormState['smoking_status'] {
  if (value === 'never' || value === 'former' || value === 'current') return value;
  return '';
}

function appendMedicalHistoryNote(current: string, note: string): string {
  const trimmed = current.trim();
  if (!trimmed) return note;
  if (trimmed.includes(note)) return trimmed;
  return `${trimmed}\n${note}`;
}

function shouldFillEmpty(currentEmpty: boolean, tier: ReturnType<typeof resolveConfidenceTier>): boolean {
  if (!currentEmpty) return false;
  return tier !== 'low';
}

export function applyVoiceExtractionToDemographics(
  form: ConversationFormState,
  extraction: VoiceScreeningExtractionResult,
): { form: ConversationFormState; hints: DemographicsFieldHints } {
  const next = { ...form };
  const hints: DemographicsFieldHints = {};

  const demographicsMap: Partial<Record<VoiceScreeningFieldName, ConversationFormField>> = {
    first_name: 'first_name',
    last_name: 'last_name',
    phone: 'phone',
    age: 'age',
    gender: 'gender',
    city: 'city',
  };

  for (const voiceField of Object.keys(demographicsMap) as VoiceScreeningFieldName[]) {
    const formField = demographicsMap[voiceField];
    if (!formField) continue;

    const entry = extraction.fields[voiceField];
    if (!entry) continue;

    const tier = resolveConfidenceTier(entry.confidence);
    const currentValue = next[formField];
    const isEmpty =
      typeof currentValue === 'string' ? isStringEmpty(currentValue) : isNullableEmpty(currentValue);

    if (!shouldFillEmpty(isEmpty, tier)) continue;

    if (formField === 'phone' && typeof entry.value === 'string') {
      next.phone = formatPhoneInput(entry.value);
      hints.phone = buildHint(entry.confidence, entry.source_sentence);
      continue;
    }

    if (formField === 'age') {
      const age = String(entry.value).trim();
      if (!age) continue;
      next.age = age;
      hints.age = buildHint(entry.confidence, entry.source_sentence);
      continue;
    }

    if (formField === 'gender') {
      const gender = normalizeGender(entry.value);
      if (!gender) continue;
      next.gender = gender;
      hints.gender = buildHint(entry.confidence, entry.source_sentence);
      continue;
    }

    if (typeof entry.value === 'string') {
      const text = entry.value.trim();
      if (!text) continue;

      if (formField === 'first_name') {
        next.first_name = text;
        hints.first_name = buildHint(entry.confidence, entry.source_sentence);
      } else if (formField === 'last_name') {
        next.last_name = text;
        hints.last_name = buildHint(entry.confidence, entry.source_sentence);
      } else if (formField === 'city') {
        next.city = text;
        hints.city = buildHint(entry.confidence, entry.source_sentence);
      }
    }
  }

  return { form: next, hints };
}

export function applyVoiceExtractionToMeasurements(
  form: MeasurementsFormState,
  extraction: VoiceScreeningExtractionResult,
): { form: MeasurementsFormState; hints: MeasurementsFieldHints } {
  const next = { ...form };
  const hints: MeasurementsFieldHints = {};

  const measurementFields: VoiceScreeningFieldName[] = [
    'systolic_bp',
    'diastolic_bp',
    'pulse',
    'blood_glucose',
    'weight_kg',
    'height_cm',
    'waist_circumference_cm',
  ];

  for (const field of measurementFields) {
    const entry = extraction.fields[field];
    if (!entry) continue;

    const tier = resolveConfidenceTier(entry.confidence);
    const currentValue = next[field as keyof MeasurementsFormState];
    const isEmpty = typeof currentValue === 'string' ? isStringEmpty(currentValue) : isNullableEmpty(currentValue);

    if (!shouldFillEmpty(isEmpty, tier)) continue;

    const formatted = formatNumericField(entry.value);
    if (!formatted) continue;

    switch (field) {
      case 'systolic_bp':
        next.systolic_bp = formatted;
        break;
      case 'diastolic_bp':
        next.diastolic_bp = formatted;
        break;
      case 'pulse':
        next.pulse = formatted;
        break;
      case 'blood_glucose':
        next.blood_glucose = formatted;
        break;
      case 'weight_kg':
        next.weight_kg = formatted;
        break;
      case 'height_cm':
        next.height_cm = formatted;
        break;
      case 'waist_circumference_cm':
        next.waist_circumference_cm = formatted;
        break;
      default:
        continue;
    }

    hints[field as keyof MeasurementsFormState] = buildHint(entry.confidence, entry.source_sentence);
  }

  return { form: next, hints };
}

export function applyVoiceExtractionToAnamnesis(
  form: AnamnesisFormState,
  extraction: VoiceScreeningExtractionResult,
): { form: AnamnesisFormState; hints: AnamnesisVoiceFieldHints } {
  const next = { ...form };
  const hints: AnamnesisVoiceFieldHints = {};

  const directMap: Partial<Record<VoiceScreeningFieldName, AnamnesisFormField>> = {
    smoking_status: 'smoking_status',
    known_hypertension: 'known_hypertension',
    known_diabetes: 'known_diabetes',
    dyspnea: 'dyspnea',
    snoring: 'snoring',
    current_treatment: 'current_treatment',
    medical_history: 'medical_history',
  };

  for (const voiceField of Object.keys(directMap) as VoiceScreeningFieldName[]) {
    const formField = directMap[voiceField];
    if (!formField) continue;

    const entry = extraction.fields[voiceField];
    if (!entry) continue;

    const tier = resolveConfidenceTier(entry.confidence);
    const currentValue = next[formField];
    const isEmpty =
      typeof currentValue === 'string' ? isStringEmpty(currentValue) : isNullableEmpty(currentValue);

    if (!shouldFillEmpty(isEmpty, tier)) continue;

    if (formField === 'smoking_status') {
      const smoking = normalizeSmokingStatus(entry.value);
      if (!smoking) continue;
      next.smoking_status = smoking;
    } else if (formField === 'current_treatment' || formField === 'medical_history') {
      const text = String(entry.value).trim();
      if (!text) continue;
      next[formField] = text;
    } else if (
      (formField === 'known_hypertension' ||
        formField === 'known_diabetes' ||
        formField === 'dyspnea' ||
        formField === 'snoring') &&
      typeof entry.value === 'boolean'
    ) {
      next[formField] = entry.value;
    } else {
      continue;
    }

    hints[formField] = buildHint(entry.confidence, entry.source_sentence);
  }

  const chestPainEntry = extraction.fields.chest_pain;
  if (chestPainEntry && isNullableEmpty(next.chest_pain)) {
    const tier = resolveConfidenceTier(chestPainEntry.confidence);
    if (shouldFillEmpty(true, tier)) {
      const mapped = mapExtractedChestPain(chestPainEntry.value, chestPainEntry.source_sentence);
      if (mapped !== null) {
        next.chest_pain = mapped;
        hints.chest_pain = buildHint(chestPainEntry.confidence, chestPainEntry.source_sentence);
      }
    }
  }

  const cholesterolEntry = extraction.fields.cholesterol_mg_dl;
  if (cholesterolEntry && isStringEmpty(next.medical_history)) {
    const tier = resolveConfidenceTier(cholesterolEntry.confidence);
    if (shouldFillEmpty(true, tier)) {
      const value = formatNumericField(cholesterolEntry.value);
      if (value) {
        next.medical_history = appendMedicalHistoryNote('', `Colesterol: ${value} mg/dL`);
        hints.medical_history = buildHint(cholesterolEntry.confidence, cholesterolEntry.source_sentence);
      }
    }
  }

  return { form: next, hints };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Nu s-a putut converti audio-ul.'));
        return;
      }
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(new Error('Nu s-a putut citi fișierul audio.'));
    reader.readAsDataURL(blob);
  });
}
