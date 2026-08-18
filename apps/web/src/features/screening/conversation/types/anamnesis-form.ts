import type { SmokingStatus, AlcoholConsumption } from './conversation-form';
import type { ChestPainAnswer } from '../lib/screening-questions';

export type DiabetesType = 'type1' | 'type2' | 'gestational';

export interface AnamnesisFormState {

  chief_complaint: string;

  symptoms: string;

  medical_history: string;

  medications: string;

  allergies: string;

  smoking_status: SmokingStatus;

  alcohol_consumption: AlcoholConsumption;

  family_history: string;

  lifestyle: string;

  risk_factors: string;

  known_hypertension: boolean | null;

  known_diabetes: boolean | null;

  diabetes_type: DiabetesType | null;

  chest_pain: ChestPainAnswer;

  dyspnea: boolean | null;

  snoring: boolean | null;

  follows_treatment: boolean | null;

  current_treatment: string;

  free_notes: string;

  clinical_summary: string;

}



export type AnamnesisFormField = keyof AnamnesisFormState;



/** Festival cardiovascular screening — no mandatory questions to keep the flow fast. */

export const ANAMNESIS_REQUIRED_FIELDS: AnamnesisFormField[] = [];



export const ANAMNESIS_FIELD_LABELS: Record<AnamnesisFormField, string> = {

  chief_complaint: 'Motiv principal',

  symptoms: 'Simptome',

  medical_history: 'Antecedente medicale',

  medications: 'Medicație curentă',

  allergies: 'Alergii',

  smoking_status: 'Fumător',

  alcohol_consumption: 'Consum alcool',

  family_history: 'Antecedente familiale',

  lifestyle: 'Stil de viață',

  risk_factors: 'Factori de risc',

  known_hypertension: 'Hipertensiune cunoscută',

  known_diabetes: 'Diabet cunoscut',

  diabetes_type: 'Tip diabet',

  chest_pain: 'Ați avut în ultima perioadă dureri sau apăsare în piept?',

  dyspnea: 'Obosiți sau rămâneți fără aer mai ușor decât înainte?',

  snoring: 'Sforăie frecvent noaptea?',

  follows_treatment: 'Urmează tratament?',

  current_treatment: 'Detalii tratament (opțional)',

  free_notes: 'Note clinice suplimentare',

  clinical_summary: 'Rezumat clinic',

};



export const ANAMNESIS_FIELD_ELEMENT_ID: Record<AnamnesisFormField, string> = {

  chief_complaint: 'anamnesis-field-chief_complaint',

  symptoms: 'anamnesis-field-symptoms',

  medical_history: 'anamnesis-field-medical_history',

  medications: 'anamnesis-field-medications',

  allergies: 'anamnesis-field-allergies',

  smoking_status: 'anamnesis-field-smoking_status',

  alcohol_consumption: 'anamnesis-field-alcohol_consumption',

  family_history: 'anamnesis-field-family_history',

  lifestyle: 'anamnesis-field-lifestyle',

  risk_factors: 'anamnesis-field-risk_factors',

  known_hypertension: 'anamnesis-field-known_hypertension',

  known_diabetes: 'anamnesis-field-known_diabetes',

  diabetes_type: 'anamnesis-field-diabetes_type',

  chest_pain: 'anamnesis-field-chest_pain',

  dyspnea: 'anamnesis-field-dyspnea',

  snoring: 'anamnesis-field-snoring',

  follows_treatment: 'anamnesis-field-follows_treatment',

  current_treatment: 'anamnesis-field-current_treatment',

  free_notes: 'anamnesis-field-free_notes',

  clinical_summary: 'anamnesis-field-clinical_summary',

};



export const ANAMNESIS_EXTRACTION_FIELDS: AnamnesisFormField[] = [

  'known_hypertension',

  'known_diabetes',

  'smoking_status',

  'chest_pain',

  'dyspnea',

  'snoring',

  'follows_treatment',

  'current_treatment',

];



export function createEmptyAnamnesisForm(): AnamnesisFormState {

  return {

    chief_complaint: '',

    symptoms: '',

    medical_history: '',

    medications: '',

    allergies: '',

    smoking_status: '',

    alcohol_consumption: '',

    family_history: '',

    lifestyle: '',

    risk_factors: '',

    known_hypertension: null,

    known_diabetes: null,

    diabetes_type: null,

    chest_pain: null,

    dyspnea: null,

    snoring: null,

    follows_treatment: null,

    current_treatment: '',

    free_notes: '',

    clinical_summary: '',

  };

}



export function isAnamnesisFieldComplete(

  form: AnamnesisFormState,

  field: AnamnesisFormField,

): boolean {

  if (!ANAMNESIS_REQUIRED_FIELDS.includes(field)) {

    return true;

  }



  const value = form[field];

  if (typeof value === 'boolean') {

    return true;

  }

  if (value === null) {

    return false;

  }

  return String(value).trim().length > 0;

}



export function getMissingAnamnesisRequiredFields(

  form: AnamnesisFormState,

): AnamnesisFormField[] {

  return ANAMNESIS_REQUIRED_FIELDS.filter((field) => !isAnamnesisFieldComplete(form, field));

}



export function scrollToAnamnesisField(field: AnamnesisFormField): void {

  const elementId = ANAMNESIS_FIELD_ELEMENT_ID[field];

  requestAnimationFrame(() => {

    const element = document.getElementById(elementId);

    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {

      element.focus({ preventScroll: true });

    }

  });

}



export function calculateAnamnesisProgress(form: AnamnesisFormState): {

  percent: number;

  missingRequired: AnamnesisFormField[];

} {

  const missingRequired = getMissingAnamnesisRequiredFields(form);

  if (ANAMNESIS_REQUIRED_FIELDS.length === 0) {

    return { percent: 100, missingRequired };

  }

  const filled = ANAMNESIS_REQUIRED_FIELDS.length - missingRequired.length;

  const percent = Math.round((filled / ANAMNESIS_REQUIRED_FIELDS.length) * 100);

  return { percent, missingRequired };

}


