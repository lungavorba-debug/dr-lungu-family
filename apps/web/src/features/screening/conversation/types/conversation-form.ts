import type { PatientGender } from '@medscreen/types';

export type SmokingStatus = 'never' | 'former' | 'current' | '';
export type AlcoholConsumption = 'none' | 'occasional' | 'regular' | '';

export interface ConversationFormState {
  first_name: string;
  last_name: string;
  phone: string;
  age: string;
  gender: PatientGender | '';
  city: string;
  smoking_status: SmokingStatus;
  alcohol_consumption: AlcoholConsumption;
  known_diabetes: boolean | null;
  chest_pain: boolean | null;
  dyspnea: boolean | null;
  snoring: boolean | null;
  current_treatment: string;
  free_notes: string;
}

export type ConversationFormField = keyof ConversationFormState;

export const CONVERSATION_REQUIRED_FIELDS: ConversationFormField[] = [
  'first_name',
  'last_name',
  'phone',
  'age',
  'gender',
  'city',
];

export const CONVERSATION_FIELD_LABELS: Record<ConversationFormField, string> = {
  first_name: 'Prenume',
  last_name: 'Nume',
  phone: 'Telefon',
  age: 'Vârstă',
  gender: 'Sex',
  city: 'Localitate',
  smoking_status: 'Fumat',
  alcohol_consumption: 'Consum alcool',
  known_diabetes: 'Diabet cunoscut',
  chest_pain: 'Durere toracică',
  dyspnea: 'Dispnee',
  snoring: 'Sforăit',
  current_treatment: 'Tratament curent',
  free_notes: 'Note libere',
};

export const CONVERSATION_FIELD_ELEMENT_ID: Record<ConversationFormField, string> = {
  first_name: 'conversation-field-first_name',
  last_name: 'conversation-field-last_name',
  phone: 'conversation-field-phone',
  age: 'conversation-field-age',
  gender: 'conversation-field-gender',
  city: 'conversation-field-city',
  smoking_status: 'conversation-field-smoking_status',
  alcohol_consumption: 'conversation-field-alcohol_consumption',
  known_diabetes: 'conversation-field-known_diabetes',
  chest_pain: 'conversation-field-chest_pain',
  dyspnea: 'conversation-field-dyspnea',
  snoring: 'conversation-field-snoring',
  current_treatment: 'conversation-field-current_treatment',
  free_notes: 'conversation-field-free_notes',
};

export function createEmptyConversationForm(): ConversationFormState {
  return {
    first_name: '',
    last_name: '',
    phone: '',
    age: '',
    gender: '',
    city: '',
    smoking_status: '',
    alcohol_consumption: '',
    known_diabetes: null,
    chest_pain: null,
    dyspnea: null,
    snoring: null,
    current_treatment: '',
    free_notes: '',
  };
}

export function isConversationFieldComplete(
  form: ConversationFormState,
  field: ConversationFormField,
): boolean {
  if (!CONVERSATION_REQUIRED_FIELDS.includes(field)) {
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

export function getMissingConversationRequiredFields(
  form: ConversationFormState,
): ConversationFormField[] {
  return CONVERSATION_REQUIRED_FIELDS.filter(
    (field) => !isConversationFieldComplete(form, field),
  );
}

export function scrollToConversationField(field: ConversationFormField): void {
  const elementId = CONVERSATION_FIELD_ELEMENT_ID[field];
  requestAnimationFrame(() => {
    const element = document.getElementById(elementId);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.focus({ preventScroll: true });
    }
  });
}

export function calculateConversationProgress(form: ConversationFormState): {
  percent: number;
  missingRequired: ConversationFormField[];
} {
  const missingRequired = getMissingConversationRequiredFields(form);
  const filled = CONVERSATION_REQUIRED_FIELDS.length - missingRequired.length;
  const percent = Math.round((filled / CONVERSATION_REQUIRED_FIELDS.length) * 100);
  return { percent, missingRequired };
}
