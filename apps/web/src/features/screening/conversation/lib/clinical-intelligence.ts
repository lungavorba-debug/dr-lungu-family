import type { ScreeningExtractionResult } from '@medscreen/types';

import type {

  AnamnesisFormField,

  AnamnesisFormState,

} from '../types/anamnesis-form';

import { ANAMNESIS_FIELD_LABELS } from '../types/anamnesis-form';

import {

  CARDIOVASCULAR_SCREENING_EXTRACTION_FIELDS,

  isCardiovascularScreeningExtractionField,

  mapExtractedChestPain,

} from './screening-questions';

import {

  resolveConfidenceTier,

} from './confidence-merge';



export interface AnamnesisTopic {

  id: string;

  label: string;

  fields: AnamnesisFormField[];

}



export const IMPORTANT_ANAMNESIS_TOPICS: AnamnesisTopic[] = [

  {

    id: 'hypertension',

    label: 'Știți să aveți tensiune mare sau urmați tratament pentru tensiune?',

    fields: ['known_hypertension'],

  },

  {

    id: 'diabetes',

    label: 'Știți să aveți diabet sau urmați tratament pentru diabet?',

    fields: ['known_diabetes'],

  },

  { id: 'smoking', label: 'Fumați în prezent?', fields: ['smoking_status'] },

  { id: 'treatment', label: 'Urmați un tratament în fiecare zi?', fields: ['follows_treatment', 'current_treatment'] },

  {

    id: 'chest_pain',

    label: 'Ați avut în ultima perioadă dureri sau apăsare în piept?',

    fields: ['chest_pain'],

  },

  {

    id: 'dyspnea',

    label: 'Obosiți sau rămâneți fără aer mai ușor decât înainte?',

    fields: ['dyspnea'],

  },

  { id: 'snoring', label: 'Vi s-a spus că sforăiți frecvent în timpul nopții?', fields: ['snoring'] },

];



export interface AnamnesisFieldContradiction {

  field: AnamnesisFormField;

  label: string;

  currentValue: string;

  proposedValue: string;

  proposedRaw: AnamnesisFormState[AnamnesisFormField];

  sourceSentence?: string | null;

}



const EXTRACTION_FIELD_MAP: Partial<Record<string, AnamnesisFormField>> = {

  known_hypertension: 'known_hypertension',

  known_diabetes: 'known_diabetes',

  smoking_status: 'smoking_status',

  chest_pain: 'chest_pain',

  dyspnea: 'dyspnea',

  snoring: 'snoring',

  current_treatment: 'current_treatment',

};



function isFieldEmpty(value: AnamnesisFormState[AnamnesisFormField]): boolean {

  if (value === null || value === undefined) return true;

  if (typeof value === 'string') return value.trim().length === 0;

  return false;

}



function formatFieldValue(value: AnamnesisFormState[AnamnesisFormField]): string {

  if (value === null || value === undefined) return '';

  if (typeof value === 'boolean') return value ? 'Da' : 'Nu';

  if (value === 'never') return 'Nu';

  if (value === 'former') return 'Fost fumător';

  if (value === 'current') return 'Da';

  if (value === 'none') return 'Nu';

  if (value === 'effort') return 'La efort';

  if (value === 'rest') return 'În repaus';

  if (value === 'both') return 'Atât la efort, cât și în repaus';

  return String(value).trim();

}



function normalizeComparable(value: AnamnesisFormState[AnamnesisFormField]): string {

  return formatFieldValue(value).toLowerCase();

}



export function valuesConflict(

  current: AnamnesisFormState[AnamnesisFormField],

  proposed: AnamnesisFormState[AnamnesisFormField],

): boolean {

  if (isFieldEmpty(current) || isFieldEmpty(proposed)) {

    return false;

  }

  return normalizeComparable(current) !== normalizeComparable(proposed);

}



export function isTopicCovered(form: AnamnesisFormState, topic: AnamnesisTopic): boolean {

  return topic.fields.some((field) => !isFieldEmpty(form[field]));

}



export function getMissingAnamnesisTopics(form: AnamnesisFormState): AnamnesisTopic[] {

  return IMPORTANT_ANAMNESIS_TOPICS.filter((topic) => !isTopicCovered(form, topic));

}



export function shouldShowCoverageChecklist(options: {

  assistantStarted: boolean;

  interviewActive: boolean;

  missingTopicsCount: number;

}): boolean {

  if (!options.assistantStarted || options.missingTopicsCount === 0) {

    return false;

  }

  return !options.interviewActive;

}



export interface MergeAnamnesisResult {

  form: AnamnesisFormState;

  contradictions: AnamnesisFieldContradiction[];

}



function inferFollowsTreatmentFromTranscript(sourceSentence: string | null | undefined): boolean | undefined {

  if (!sourceSentence) return undefined;

  const lower = sourceSentence.toLowerCase();

  if (/\b(nu|fără)\b/.test(lower) && /\b(tratament|medica[tț]ie|pastile)\b/.test(lower)) {

    return false;

  }

  if (/\b(da|urmeaz|ia[uă])\b/.test(lower) && /\b(tratament|medica[tț]ie|pastile)\b/.test(lower)) {

    return true;

  }

  return undefined;

}



export function filterCardiovascularScreeningExtraction(

  extraction: ScreeningExtractionResult,

): ScreeningExtractionResult {

  const fields: ScreeningExtractionResult['fields'] = {};

  for (const [fieldName, entry] of Object.entries(extraction.fields)) {

    if (entry && isCardiovascularScreeningExtractionField(fieldName)) {

      fields[fieldName as keyof ScreeningExtractionResult['fields']] = entry;

    }

  }

  return { ...extraction, fields };

}



export function mergeAnamnesisExtractionClinical(

  current: AnamnesisFormState,

  extraction: ScreeningExtractionResult,

  lockedFields: Set<AnamnesisFormField>,

): MergeAnamnesisResult {

  const next: AnamnesisFormState = { ...current };

  const contradictions: AnamnesisFieldContradiction[] = [];

  const filtered = filterCardiovascularScreeningExtraction(extraction);



  for (const [fieldName, entry] of Object.entries(filtered.fields)) {

    if (!entry) continue;

    if (!isCardiovascularScreeningExtractionField(fieldName)) continue;



    const formField = EXTRACTION_FIELD_MAP[fieldName];

    if (!formField || lockedFields.has(formField)) {

      continue;

    }



    const tier = resolveConfidenceTier(entry.confidence);

    const currentValue = next[formField];

    let extractedValue = entry.value as AnamnesisFormState[AnamnesisFormField];



    if (extractedValue === undefined || extractedValue === null) continue;

    if (typeof extractedValue === 'string' && extractedValue.trim() === '') continue;



    if (formField === 'current_treatment') {

      const inferredFollows = inferFollowsTreatmentFromTranscript(entry.source_sentence);

      if (inferredFollows === false) {

        next.follows_treatment = false;

        continue;

      }

      if (inferredFollows === true) {

        next.follows_treatment = true;

      }

    }



    if (formField === 'chest_pain') {

      extractedValue = mapExtractedChestPain(entry.value, entry.source_sentence) as AnamnesisFormState[AnamnesisFormField];

      if (extractedValue === null) continue;

    }



    if (valuesConflict(currentValue, extractedValue)) {

      contradictions.push({

        field: formField,

        label: ANAMNESIS_FIELD_LABELS[formField],

        currentValue: formatFieldValue(currentValue),

        proposedValue: formatFieldValue(extractedValue),

        proposedRaw: extractedValue,

        sourceSentence: entry.source_sentence ?? null,

      });

      continue;

    }



    if (tier === 'low' && !isFieldEmpty(currentValue)) continue;

    if (tier === 'medium' && !isFieldEmpty(currentValue)) continue;



    (next as Record<AnamnesisFormField, AnamnesisFormState[AnamnesisFormField]>)[formField] =

      extractedValue;



    if (formField === 'current_treatment' && String(extractedValue).trim()) {

      next.follows_treatment = true;

    }

  }



  return { form: next, contradictions };

}



export function sanitizeClinicalNotes(form: AnamnesisFormState, _rawNotes: string): string {

  return form.free_notes;

}



const SMOKING_LABELS: Record<string, string> = {

  never: 'Nu fumează',

  former: 'Fost fumător',

  current: 'Fumător',

};



export function buildClinicalSummary(form: AnamnesisFormState): string {

  const bullets: string[] = [];



  if (form.known_hypertension === true) bullets.push('Hipertensiune cunoscută');

  if (form.known_hypertension === false) bullets.push('Fără hipertensiune cunoscută');

  if (form.known_diabetes === true) bullets.push('Diabet cunoscut');

  if (form.known_diabetes === false) bullets.push('Fără diabet cunoscut');

  if (form.smoking_status) {

    bullets.push(SMOKING_LABELS[form.smoking_status] ?? `Fumător: ${form.smoking_status}`);

  }

  if (form.follows_treatment === true) {

    bullets.push(

      form.current_treatment.trim()

        ? `Urmează tratament: ${form.current_treatment.trim()}`

        : 'Urmează tratament',

    );

  } else if (form.follows_treatment === false) {

    bullets.push('Nu urmează tratament');

  }

  if (form.snoring === true) bullets.push('Sforăit frecvent noaptea');

  if (form.snoring === false) bullets.push('Nu sforăie frecvent');



  const unique = [...new Set(bullets.map((b) => b.trim()).filter(Boolean))];

  return unique.slice(0, 8).map((line) => `• ${line}`).join('\n');

}



export { CARDIOVASCULAR_SCREENING_EXTRACTION_FIELDS };


