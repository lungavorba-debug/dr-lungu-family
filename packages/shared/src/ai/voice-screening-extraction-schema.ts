import type { VoiceScreeningFieldName } from '@medscreen/types';

export const VOICE_SCREENING_FIELD_NAMES: VoiceScreeningFieldName[] = [
  'first_name',
  'last_name',
  'phone',
  'age',
  'gender',
  'city',
  'systolic_bp',
  'diastolic_bp',
  'pulse',
  'blood_glucose',
  'cholesterol_mg_dl',
  'waist_circumference_cm',
  'weight_kg',
  'height_cm',
  'smoking_status',
  'medical_history',
  'known_hypertension',
  'known_diabetes',
  'chest_pain',
  'dyspnea',
  'snoring',
  'current_treatment',
];

export const VOICE_SCREENING_EXTRACTION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: Object.fromEntries(
    VOICE_SCREENING_FIELD_NAMES.map((field) => [
      field,
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          value: {},
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          source_sentence: { type: 'string' },
        },
        required: ['value', 'confidence'],
      },
    ]),
  ),
} as const;

export const VOICE_SCREENING_EXTRACTION_SYSTEM_PROMPT = `You are a cardiovascular screening assistant for Romanian public health events (festival environment with background noise).

STRICT RULES — NO HALLUCINATION:
- Extract ONLY values explicitly stated by the PARTICIPANT (patient) in the transcript.
- NEVER guess, infer, calculate, or fill missing values. If not explicitly stated, OMIT the field entirely.
- IGNORE: greetings, small talk, staff/operator speech, background conversations, music, ambient noise.
- Operator questions provide context only — never populate fields from operator speech.
- Example: Operator "Fumați?" → Participant "Nu." → smoking_status = never.
- Example: Operator "Care e tensiunea?" → Participant "140 cu 90" → systolic_bp = 140, diastolic_bp = 90.

Allowed fields:
- Participant: first_name, last_name, phone, age (integer), gender (M|F), city
- Vitals & measurements (numbers only when explicitly stated):
  - systolic_bp, diastolic_bp (mmHg)
  - pulse (bpm)
  - blood_glucose (mg/dL)
  - cholesterol_mg_dl (mg/dL)
  - waist_circumference_cm (cm)
  - weight_kg (kg)
  - height_cm (cm)
- Screening:
  - smoking_status (never|former|current)
  - known_hypertension (boolean)
  - known_diabetes (boolean)
  - chest_pain (none|effort|rest|both)
  - dyspnea (boolean)
  - snoring (boolean)
  - current_treatment (string, only if participant voluntarily describes treatment)
  - medical_history (string, only explicit medical history statements by participant)

Return JSON only. For each populated field include value, confidence (0-1), and source_sentence (short participant quote).
Omit any field not explicitly stated. Do not use null — omit the key instead.`;

export function parseVoiceScreeningPayload(
  raw: unknown,
): Record<string, { value: unknown; confidence: number; source_sentence?: string | null }> {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const parsed: Record<string, { value: unknown; confidence: number; source_sentence?: string | null }> = {};
  const allowed = new Set<string>(VOICE_SCREENING_FIELD_NAMES);

  for (const [key, entry] of Object.entries(raw as Record<string, unknown>)) {
    if (!allowed.has(key)) continue;
    if (!entry || typeof entry !== 'object') continue;

    const value = (entry as { value?: unknown }).value;
    const confidenceRaw = (entry as { confidence?: unknown }).confidence;
    const sourceSentenceRaw = (entry as { source_sentence?: unknown }).source_sentence;

    const confidence =
      typeof confidenceRaw === 'number' && Number.isFinite(confidenceRaw)
        ? Math.min(1, Math.max(0, confidenceRaw))
        : 0.5;

    const source_sentence =
      typeof sourceSentenceRaw === 'string' && sourceSentenceRaw.trim()
        ? sourceSentenceRaw.trim()
        : null;

    if (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) {
      parsed[key] = { value, confidence, source_sentence };
    }
  }

  return parsed;
}
