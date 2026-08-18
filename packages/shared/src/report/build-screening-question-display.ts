import type { ScreeningAnamnesis } from '@medscreen/types';

import type { ReportScreeningQuestionRow } from './participant-report.schema';

export type DiabetesType = 'type1' | 'type2' | 'gestational';

export interface ScreeningQuestionDisplaySource {
  known_hypertension?: boolean | null;
  known_diabetes?: boolean | null;
  diabetes_type?: DiabetesType | null;
  smoking_status?: string | null;
  follows_treatment?: boolean | null;
  current_treatment?: string | null;
  chest_pain?: 'none' | 'effort' | 'rest' | 'both' | boolean | null;
  dyspnea?: boolean | null;
  snoring?: boolean | null;
}

function readKnownHypertension(source: ScreeningQuestionDisplaySource | ScreeningAnamnesis) {
  return 'known_hypertension' in source ? source.known_hypertension : null;
}

function readFollowsTreatment(source: ScreeningQuestionDisplaySource | ScreeningAnamnesis) {
  return 'follows_treatment' in source ? source.follows_treatment : null;
}

function asDisplaySource(source: ScreeningQuestionDisplaySource | ScreeningAnamnesis): ScreeningQuestionDisplaySource {
  return {
    known_hypertension: readKnownHypertension(source),
    known_diabetes: source.known_diabetes,
    diabetes_type: 'diabetes_type' in source ? source.diabetes_type : null,
    smoking_status: source.smoking_status,
    follows_treatment: readFollowsTreatment(source),
    current_treatment: source.current_treatment,
    chest_pain: source.chest_pain,
    dyspnea: source.dyspnea,
    snoring: source.snoring,
  };
}

const SCREENING_QUESTION_TOPICS = {
  known_hypertension: 'Hipertensiune cunoscută',
  known_diabetes: 'Diabet cunoscut',
  smoking_status: 'Fumător',
  treatment: 'Tratament',
  snoring: 'Sforăit',
  chest_pain: 'Durere în piept',
  dyspnea: 'Respirație îngreunată',
} as const;

function formatDiabetesType(value: DiabetesType | null | undefined): string | null {
  if (value === 'type1') return 'Tip 1';
  if (value === 'type2') return 'Tip 2';
  if (value === 'gestational') return 'Gestațional';
  return null;
}

function formatDiabetesAnswer(source: ScreeningQuestionDisplaySource): string {
  if (source.known_diabetes === true) {
    const typeLabel = formatDiabetesType(source.diabetes_type);
    return typeLabel ? `Da — ${typeLabel}` : 'Da';
  }
  if (source.known_diabetes === false) return 'Nu';
  return '—';
}

function formatBooleanAnswer(value: boolean | null | undefined): string {
  if (value === true) return 'Da';
  if (value === false) return 'Nu';
  return '—';
}

function formatSmokingStatus(value: string | null | undefined): string {
  if (!value) return '—';
  if (value === 'current') return 'Da';
  if (value === 'former') return 'Fost fumător';
  if (value === 'never') return 'Nu';
  return '—';
}

function formatChestPainAnswer(
  value: ScreeningQuestionDisplaySource['chest_pain'],
): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return formatBooleanAnswer(value);
  if (value === 'none') return 'Nu';
  if (value === 'effort') return 'La efort';
  if (value === 'rest') return 'În repaus';
  if (value === 'both') return 'La efort și în repaus';
  return '—';
}

function formatTreatmentAnswer(source: ScreeningQuestionDisplaySource): string {
  const follows = source.follows_treatment;
  const details = source.current_treatment?.trim();

  if (follows === true) {
    return details ? `Da — ${details}` : 'Da';
  }
  if (follows === false) return 'Nu';
  if (details) return details;
  return '—';
}

/** Build participant-facing screening Q&A rows for report layout. */
export function buildScreeningQuestionDisplayRows(
  source: ScreeningQuestionDisplaySource | ScreeningAnamnesis,
): ReportScreeningQuestionRow[] {
  const display = asDisplaySource(source);
  return [
    {
      topic: SCREENING_QUESTION_TOPICS.known_hypertension,
      answer: formatBooleanAnswer(display.known_hypertension),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.known_diabetes,
      answer: formatDiabetesAnswer(display),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.smoking_status,
      answer: formatSmokingStatus(display.smoking_status ?? null),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.treatment,
      answer: formatTreatmentAnswer(display),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.snoring,
      answer: formatBooleanAnswer(display.snoring),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.chest_pain,
      answer: formatChestPainAnswer(display.chest_pain),
    },
    {
      topic: SCREENING_QUESTION_TOPICS.dyspnea,
      answer: formatBooleanAnswer(display.dyspnea),
    },
  ].filter((row) => row.answer !== '—');
}
