import type {
  VoiceScreeningExtractionFields,
  VoiceScreeningExtractionResult,
  VoiceScreeningFieldName,
} from '@medscreen/types';
import { normalizePhone } from '../utils/phone';
import { VOICE_SCREENING_FIELD_NAMES } from './voice-screening-extraction-schema';

function field<T>(value: T, confidence: number): VoiceScreeningExtractionFields[VoiceScreeningFieldName] {
  return { value, confidence, source: 'heuristic' as const };
}

export function createEmptyVoiceScreeningExtraction(): VoiceScreeningExtractionResult {
  return {
    fields: {},
    provider_id: 'none',
    model: 'none',
    extracted_at: new Date().toISOString(),
  };
}

export function hasVoiceExtractableFields(extraction: VoiceScreeningExtractionResult): boolean {
  return Object.values(extraction.fields).some((entry) => entry !== null && entry !== undefined);
}

export function extractVoiceScreeningFieldsHeuristic(transcript: string): VoiceScreeningExtractionResult {
  const lower = transcript.toLowerCase();
  const fields: VoiceScreeningExtractionFields = {};

  const phoneMatch = transcript.match(/(?:0|\+40)?7\d{8}/);
  if (phoneMatch) {
    fields.phone = field(normalizePhone(phoneMatch[0]), 0.92);
  }

  const ageMatch = lower.match(/(\d{1,3})\s*(?:de\s*)?ani/);
  if (ageMatch) {
    fields.age = field(Number.parseInt(ageMatch[1], 10), 0.88);
  }

  if (/\b(masculin|barbat|bărbat)\b/.test(lower)) {
    fields.gender = field('M', 0.85);
  } else if (/\b(feminin|femeie)\b/.test(lower)) {
    fields.gender = field('F', 0.85);
  }

  const bpSlash = lower.match(/(\d{2,3})\s*[\/\-]\s*(\d{2,3})/);
  const bpCu = lower.match(/(\d{2,3})\s*(?:cu|pe|over|\/)\s*(\d{2,3})/);
  const bpMatch = bpSlash ?? bpCu;
  if (bpMatch) {
    fields.systolic_bp = field(Number.parseInt(bpMatch[1], 10), 0.86);
    fields.diastolic_bp = field(Number.parseInt(bpMatch[2], 10), 0.86);
  }

  const pulseMatch = lower.match(/(?:puls|batai|bătăi)\s*(?:de\s*)?(\d{2,3})/);
  if (pulseMatch) {
    fields.pulse = field(Number.parseInt(pulseMatch[1], 10), 0.84);
  }

  const glucoseMatch = lower.match(/(?:glicemie|glucoză|glucoza|glicemia)\s*(?:de\s*)?(\d{2,3})/);
  if (glucoseMatch) {
    fields.blood_glucose = field(Number.parseInt(glucoseMatch[1], 10), 0.84);
  }

  const cholesterolMatch = lower.match(/(?:colesterol)\s*(?:de\s*)?(\d{2,3})/);
  if (cholesterolMatch) {
    fields.cholesterol_mg_dl = field(Number.parseInt(cholesterolMatch[1], 10), 0.84);
  }

  const weightMatch = lower.match(/(?:greutate|cantărește|cântărește|kilograme)\s*(?:de\s*)?(\d{2,3}(?:[.,]\d)?)/);
  if (weightMatch) {
    fields.weight_kg = field(Number.parseFloat(weightMatch[1].replace(',', '.')), 0.82);
  }

  const heightMatch = lower.match(/(?:înălțime|inaltime|centimetri)\s*(?:de\s*)?(\d{2,3})/);
  if (heightMatch) {
    fields.height_cm = field(Number.parseInt(heightMatch[1], 10), 0.82);
  }

  const waistMatch = lower.match(/(?:talie|circumferință talie)\s*(?:de\s*)?(\d{2,3})/);
  if (waistMatch) {
    fields.waist_circumference_cm = field(Number.parseInt(waistMatch[1], 10), 0.82);
  }

  if (/\b(nu fumez|nefumator|nefumător|niciodata nu am fumat)\b/.test(lower)) {
    fields.smoking_status = field('never', 0.8);
  } else if (/\b(fost fumator|m-am lasat|m-am lăsat)\b/.test(lower)) {
    fields.smoking_status = field('former', 0.78);
  } else if (/\b(fumez|fumator|fumător)\b/.test(lower)) {
    fields.smoking_status = field('current', 0.78);
  }

  const allowed = new Set<string>(VOICE_SCREENING_FIELD_NAMES);
  const filtered: VoiceScreeningExtractionFields = {};
  for (const [key, entry] of Object.entries(fields)) {
    if (allowed.has(key) && entry) {
      filtered[key as VoiceScreeningFieldName] = entry;
    }
  }

  return {
    fields: filtered,
    provider_id: 'heuristic',
    model: 'heuristic',
    extracted_at: new Date().toISOString(),
  };
}
