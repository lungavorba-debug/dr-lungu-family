import type { ScreeningExtractionFieldName } from '@medscreen/types';



export const SCREENING_EXTRACTION_FIELD_NAMES: ScreeningExtractionFieldName[] = [

  'first_name',

  'last_name',

  'phone',

  'age',

  'gender',

  'city',

  'chief_complaint',

  'symptoms',

  'medical_history',

  'medications',

  'allergies',

  'smoking_status',

  'alcohol_consumption',

  'family_history',

  'lifestyle',

  'risk_factors',

  'known_diabetes',

  'known_hypertension',

  'chest_pain',

  'dyspnea',

  'snoring',

  'current_treatment',

  'free_notes',

];



export const ANAMNESIS_EXTRACTION_FIELD_NAMES: ScreeningExtractionFieldName[] = [

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



export const SCREENING_EXTRACTION_JSON_SCHEMA = {

  type: 'object',

  additionalProperties: false,

  properties: Object.fromEntries(

    SCREENING_EXTRACTION_FIELD_NAMES.map((field) => [

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



export const SCREENING_EXTRACTION_SYSTEM_PROMPT = `You are a cardiovascular screening assistant for Romanian public health events.

Core behavior:
- Extract ONLY information explicitly stated by the PARTICIPANT (patient).
- IGNORE: greetings, small talk, staff discussions, background conversations, environmental speech, and doctor/operator questions treated as facts.
- Doctor/operator questions provide context only — never populate fields from operator speech.
- Example: Operator "Fumați?" → Participant "Nu." → smoking_status = never.
- Example: Operator "Știți să aveți diabet?" → Participant "Nu." → known_diabetes = false.
- Example: Operator "Fumați?" → Participant "M-am lăsat acum cinci ani." → smoking_status = former.

Allowed fields for this deployment:
- Participant identification: first_name, last_name, phone, age, gender, city
- Screening questions:
  - known_hypertension (boolean): tensiune mare sau tratament pentru tensiune
  - known_diabetes (boolean): diabet sau tratament pentru diabet
  - smoking_status (never|former|current): fumează în prezent
  - chest_pain (none|effort|rest|both): durere/apăsare în piept — none=nu, effort=la efort, rest=în repaus, both=efort și repaus
  - dyspnea (boolean): obosește sau rămâne fără aer mai ușor
  - snoring (boolean): i s-a spus că sforăie frecvent noaptea
  - current_treatment (string, optional): doar dacă participantul spune voluntar pentru ce ia tratament

Treatment rules:
- current_treatment is OPTIONAL and only when the participant voluntarily describes treatment in their own words.
- If participant says they take pills for blood pressure, set current_treatment to their exact words and infer daily treatment from context.
- Do NOT invent medication names, dosages, or diagnoses.
- If the participant only says yes/no about treatment without naming it, omit current_treatment.

Never extract or invent:
- allergies, surgical history, family history, complete medical history, review of systems, chief complaint, symptoms, diagnoses, alcohol use, lifestyle notes, or free-text clinical summaries.

Return JSON only. For each populated field include value, confidence (0-1), and source_sentence (short participant quote).
Omit fields not explicitly stated by the participant.`;



export function parseAiExtractionPayload(raw: unknown): Record<string, { value: unknown; confidence: number; source_sentence?: string | null }> {

  if (!raw || typeof raw !== 'object') {

    return {};

  }



  const parsed: Record<string, { value: unknown; confidence: number; source_sentence?: string | null }> = {};

  const allowed = new Set<string>(ANAMNESIS_EXTRACTION_FIELD_NAMES);



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


