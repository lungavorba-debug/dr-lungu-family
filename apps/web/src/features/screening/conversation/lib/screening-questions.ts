import type { ScreeningExtractionFieldName } from '@medscreen/types';
import type { AnamnesisFormField } from '../types/anamnesis-form';

/** User-facing step title for the cardiovascular screening questions phase. */
export const SCREENING_QUESTIONS_STEP_TITLE = 'Întrebări screening';

/** Chest pain pattern captured during cardiovascular screening. */
export type ChestPainAnswer = 'none' | 'effort' | 'rest' | 'both' | null;

export const CHEST_PAIN_OPTIONS: Array<{ value: Exclude<ChestPainAnswer, null>; label: string }> = [
  { value: 'none', label: 'Nu' },
  { value: 'effort', label: 'La efort' },
  { value: 'rest', label: 'În repaus' },
  { value: 'both', label: 'Atât la efort, cât și în repaus' },
];

export function chestPainAnswerToClinicalBoolean(answer: ChestPainAnswer | boolean | null): boolean | null {
  if (answer === null || answer === undefined) return null;
  if (typeof answer === 'boolean') return answer;
  if (answer === 'none') return false;
  return true;
}

export function normalizeChestPainAnswer(value: unknown): ChestPainAnswer {
  if (value === null || value === undefined) return null;
  if (value === false || value === 'false' || value === 'none' || value === 'nu') return 'none';
  if (value === true || value === 'true') return 'effort';
  if (value === 'effort' || value === 'rest' || value === 'both') return value;
  return null;
}

export function mapExtractedChestPain(
  value: unknown,
  sourceSentence?: string | null,
): ChestPainAnswer {
  const normalized = normalizeChestPainAnswer(value);
  if (normalized === 'none') return 'none';
  if (normalized === 'effort' || normalized === 'rest' || normalized === 'both') {
    return normalized;
  }

  if (value === true) {
    const lower = (sourceSentence ?? '').toLowerCase();
    if (/efort/.test(lower) && /repaus/.test(lower)) return 'both';
    if (/repaus/.test(lower)) return 'rest';
    if (/efort/.test(lower)) return 'effort';
    return null;
  }

  return null;
}

/** Form fields visible during festival cardiovascular screening. */
export const SCREENING_QUESTION_FORM_FIELDS = [
  'known_hypertension',
  'known_diabetes',
  'smoking_status',
  'follows_treatment',
  'current_treatment',
  'chest_pain',
  'dyspnea',
  'snoring',
] as const satisfies readonly AnamnesisFormField[];

export type ScreeningQuestionFormField = (typeof SCREENING_QUESTION_FORM_FIELDS)[number] | 'diabetes_type';

/** Fields the AI may populate during cardiovascular screening. */
export const CARDIOVASCULAR_SCREENING_EXTRACTION_FIELDS: ScreeningExtractionFieldName[] = [
  'first_name',
  'last_name',
  'phone',
  'age',
  'gender',
  'city',
  'known_hypertension',
  'known_diabetes',
  'smoking_status',
  'chest_pain',
  'dyspnea',
  'snoring',
  'current_treatment',
];

const SCREENING_EXTRACTION_FIELD_SET = new Set<string>(CARDIOVASCULAR_SCREENING_EXTRACTION_FIELDS);

export function isCardiovascularScreeningExtractionField(
  fieldName: string,
): fieldName is ScreeningExtractionFieldName {
  return SCREENING_EXTRACTION_FIELD_SET.has(fieldName);
}

export const SCREENING_QUESTION_LABELS: Record<ScreeningQuestionFormField, string> = {
  known_hypertension:
    'Știți să aveți tensiune mare sau urmați tratament pentru tensiune?',
  known_diabetes: 'Știți să aveți diabet sau urmați tratament pentru diabet?',
  diabetes_type: 'Ce tip de diabet aveți?',
  smoking_status: 'Fumați în prezent?',
  follows_treatment: 'Urmați un tratament în fiecare zi?',
  current_treatment: 'Dacă participantul dorește, poate spune pentru ce este tratamentul.',
  chest_pain: 'Ați avut în ultima perioadă dureri sau apăsare în piept?',
  dyspnea: 'Obosiți sau rămâneți fără aer mai ușor decât înainte?',
  snoring: 'Vi s-a spus că sforăiți frecvent în timpul nopții?',
};
