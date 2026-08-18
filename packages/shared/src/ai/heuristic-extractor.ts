import { normalizePhone } from '../utils/phone';

import type {

  ScreeningExtractionFieldName,

  ScreeningExtractionFields,

  ScreeningExtractionResult,

} from '@medscreen/types';

import { ANAMNESIS_EXTRACTION_FIELD_NAMES } from './extraction-schema';



function parseBooleanPhrase(text: string, positive: string[], negative: string[]): boolean | undefined {

  const lower = text.toLowerCase();

  if (positive.some((word) => lower.includes(word))) return true;

  if (negative.some((word) => lower.includes(word))) return false;

  return undefined;

}



function capitalize(value: string): string {

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

}



function field<T>(value: T, confidence: number): ScreeningExtractionFields[ScreeningExtractionFieldName] {

  return { value, confidence, source: 'heuristic' as const };

}



const ALLOWED_FIELDS = new Set<string>(ANAMNESIS_EXTRACTION_FIELD_NAMES);



export function extractScreeningFieldsHeuristic(transcript: string): ScreeningExtractionResult {

  const lower = transcript.toLowerCase();

  const fields: ScreeningExtractionFields = {};



  const phoneMatch = transcript.match(/(?:0|\+40)?7\d{8}/);

  if (phoneMatch) {

    fields.phone = field(normalizePhone(phoneMatch[0]), 0.92);

  }



  const ageMatch = lower.match(/(\d{1,3})\s*(?:de\s*)?ani/);

  if (ageMatch) {

    fields.age = field(ageMatch[1], 0.88);

  }



  if (/\b(masculin|barbat|bărbat)\b/.test(lower)) {

    fields.gender = field('M', 0.85);

  } else if (/\b(feminin|femeie)\b/.test(lower)) {

    fields.gender = field('F', 0.85);

  }



  const nameMatch = transcript.match(

    /(?:nume(?:le)?|pacient(?:ul)?|participant(?:ul)?)\s+([A-Za-zÀ-ž]+)\s+([A-Za-zÀ-ž]+)/i,

  );

  if (nameMatch) {

    fields.last_name = field(capitalize(nameMatch[1]), 0.75);

    fields.first_name = field(capitalize(nameMatch[2]), 0.75);

  }



  const cities = ['Pitești', 'Mioveni', 'Curtea de Argeș', 'Câmpulung', 'Costești', 'Topoloveni'];

  for (const city of cities) {

    if (lower.includes(city.toLowerCase())) {

      fields.city = field(city, 0.8);

      break;

    }

  }



  if (/\bnu fumez|nefumator|nefumător|niciodata fumat\b/.test(lower)) {

    fields.smoking_status = field('never', 0.82);

  } else if (/\bfoost fumator|fost fumător|ex-fumator\b/.test(lower)) {

    fields.smoking_status = field('former', 0.82);

  } else if (/\bfumator|fumător|fumez\b/.test(lower)) {

    fields.smoking_status = field('current', 0.82);

  }



  const diabetes = parseBooleanPhrase(lower, ['diabet', 'zaharat'], ['fara diabet', 'fără diabet', 'nu diabet']);

  if (diabetes !== undefined) fields.known_diabetes = field(diabetes, 0.76);



  const hypertension = parseBooleanPhrase(

    lower,

    ['hipertensiune', 'tensiune mare', 'tensiune crescut'],

    ['fara hipertensiune', 'fără hipertensiune', 'nu hipertensiune', 'tensiune normal'],

  );

  if (hypertension !== undefined) fields.known_hypertension = field(hypertension, 0.76);



  const snoring = parseBooleanPhrase(lower, ['sforait', 'sforăit'], ['nu sforai', 'fara sforait', 'nu sforăie']);

  if (snoring !== undefined) fields.snoring = field(snoring, 0.72);



  const dyspnea = parseBooleanPhrase(

    lower,

    ['obosesc', 'obosit', 'fara aer', 'fără aer', 'dispne', 'gafaie'],

    ['nu obosesc', 'fara oboseala', 'fără oboseală'],

  );

  if (dyspnea !== undefined) fields.dyspnea = field(dyspnea, 0.74);



  if (/\b(nu|fara|fără)\b/.test(lower) && /\b(durere|apasare|apăsare)\b/.test(lower) && /\b(piept|torace)\b/.test(lower)) {

    fields.chest_pain = field('none', 0.78);

  } else if (/durere.*efort|efort.*durere|apasare.*efort|apăsare.*efort/.test(lower)) {

    fields.chest_pain = field('effort', 0.76);

  } else if (/durere.*repaus|repaus.*durere|apasare.*repaus|apăsare.*repaus/.test(lower)) {

    fields.chest_pain = field('rest', 0.76);

  } else if (/durere.*piept|apasare.*piept|apăsare.*piept|durere toracic/.test(lower)) {

    fields.chest_pain = field('effort', 0.72);

  }



  const treatmentPhrase = transcript.match(

    /(?:iau|ia[uă]|urmez|pastile|tratament)[^.;\n]{0,60}(?:tensiune|diabet|colesterol|inima|inimă)[^.;\n]*/i,

  );

  if (treatmentPhrase) {

    fields.current_treatment = field(treatmentPhrase[0].trim(), 0.74);

  } else {

    const voluntaryTreatmentMatch = transcript.match(

      /(?:participant|pacient)[^.;\n]{0,20}(?:spune|zice)[^.;\n]{0,40}(?:tratament|pastile|medica[tț]ie)[^.;\n]{0,40}?([A-Za-zÀ-ž0-9\s,-]{3,})/i,

    );

    if (voluntaryTreatmentMatch) {

      fields.current_treatment = field(voluntaryTreatmentMatch[1].trim(), 0.72);

    }

  }



  const filtered: ScreeningExtractionFields = {};

  for (const [key, entry] of Object.entries(fields)) {

    if (entry && ALLOWED_FIELDS.has(key)) {

      filtered[key as ScreeningExtractionFieldName] = entry;

    }

  }



  return {

    fields: filtered,

    provider_id: 'heuristic',

    model: 'heuristic-v1',

    extracted_at: new Date().toISOString(),

  };

}



export function flattenExtractionFields(

  extraction: ScreeningExtractionResult,

): Record<string, unknown> {

  const flat: Record<string, unknown> = {};

  for (const [key, entry] of Object.entries(extraction.fields)) {

    if (entry) {

      flat[key] = entry.value;

    }

  }

  return flat;

}


