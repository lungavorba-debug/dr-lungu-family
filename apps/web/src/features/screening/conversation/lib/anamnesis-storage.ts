import type { ScreeningAnamnesis } from '@medscreen/types';

import type { ConversationAnamnesis } from '../../context/ScreeningSessionContext';

import type { AnamnesisFormState } from '../types/anamnesis-form';

import {

  chestPainAnswerToClinicalBoolean,

  normalizeChestPainAnswer,

} from './screening-questions';

import {

  readWorkflowStorageItem,

  removeWorkflowStorageItem,

  writeWorkflowStorageItem,

} from '../../lib/screening-workflow-storage';



const ANAMNESIS_STORAGE_KEY = 'medscreen_screening_anamnesis';



function mergeTreatmentFields(followsTreatment: boolean | null, currentTreatment: string): string {

  if (followsTreatment === false) {

    return '';

  }

  return currentTreatment.trim();

}



function composeStructuredNotes(anamnesis: ConversationAnamnesis): string {

  const sections: string[] = [];



  if (anamnesis.clinical_summary.trim()) {

    sections.push(anamnesis.clinical_summary.trim());

  }



  if (anamnesis.free_notes.trim()) {

    sections.push(anamnesis.free_notes.trim());

  }



  return sections.join('\n');

}



export function extractAnamnesisFromForm(form: AnamnesisFormState): ConversationAnamnesis {

  return {

    chief_complaint: form.chief_complaint,

    symptoms: form.symptoms,

    medical_history: form.medical_history,

    medications: form.medications,

    allergies: form.allergies,

    smoking_status: form.smoking_status,

    alcohol_consumption: form.alcohol_consumption,

    family_history: form.family_history,

    lifestyle: form.lifestyle,

    risk_factors: form.risk_factors,

    known_hypertension: form.known_hypertension,

    known_diabetes: form.known_diabetes,

    diabetes_type: form.known_diabetes === true ? form.diabetes_type : null,

    chest_pain: normalizeChestPainAnswer(form.chest_pain),

    dyspnea: form.dyspnea,

    snoring: form.snoring,

    follows_treatment: form.follows_treatment,

    current_treatment: mergeTreatmentFields(form.follows_treatment, form.current_treatment),

    free_notes: form.free_notes,

    clinical_summary: form.clinical_summary,

  };

}



export function anamnesisToFormState(anamnesis: ConversationAnamnesis): AnamnesisFormState {

  const followsTreatment =

    anamnesis.follows_treatment ??

    (anamnesis.current_treatment.trim() ? true : null);



  return {

    chief_complaint: anamnesis.chief_complaint,

    symptoms: anamnesis.symptoms,

    medical_history: anamnesis.medical_history,

    medications: anamnesis.medications,

    allergies: anamnesis.allergies,

    smoking_status: anamnesis.smoking_status,

    alcohol_consumption: anamnesis.alcohol_consumption,

    family_history: anamnesis.family_history,

    lifestyle: anamnesis.lifestyle,

    risk_factors: anamnesis.risk_factors,

    known_hypertension: anamnesis.known_hypertension,

    known_diabetes: anamnesis.known_diabetes,

    diabetes_type: anamnesis.diabetes_type ?? null,

    chest_pain: normalizeChestPainAnswer(anamnesis.chest_pain),

    dyspnea: anamnesis.dyspnea,

    snoring: anamnesis.snoring,

    follows_treatment: followsTreatment,

    current_treatment: anamnesis.current_treatment,

    free_notes: anamnesis.free_notes,

    clinical_summary: anamnesis.clinical_summary,

  };

}



export function composeScreeningAnamnesis(anamnesis: ConversationAnamnesis): ScreeningAnamnesis {

  return {

    smoking_status: anamnesis.smoking_status,

    alcohol_consumption: anamnesis.alcohol_consumption,

    known_diabetes: anamnesis.known_diabetes,

    chest_pain: chestPainAnswerToClinicalBoolean(anamnesis.chest_pain),

    dyspnea: anamnesis.dyspnea,

    snoring: anamnesis.snoring,

    current_treatment: mergeTreatmentFields(

      anamnesis.follows_treatment,

      anamnesis.current_treatment,

    ),

    free_notes: composeStructuredNotes(anamnesis),

  };

}



export function persistAnamnesis(userId: string, anamnesis: ConversationAnamnesis): void {

  writeWorkflowStorageItem(`${ANAMNESIS_STORAGE_KEY}:${userId}`, JSON.stringify(anamnesis));

}



export function loadPersistedAnamnesis(userId: string): ConversationAnamnesis | null {

  const raw = readWorkflowStorageItem(`${ANAMNESIS_STORAGE_KEY}:${userId}`);

  if (!raw) {

    return null;

  }



  try {

    return normalizePersistedAnamnesis(JSON.parse(raw));

  } catch {

    return null;

  }

}



function normalizePersistedAnamnesis(raw: unknown): ConversationAnamnesis | null {

  if (!raw || typeof raw !== 'object') {

    return null;

  }



  const parsed = raw as Partial<ConversationAnamnesis>;

  return {

    chief_complaint: parsed.chief_complaint ?? '',

    symptoms: parsed.symptoms ?? '',

    medical_history: parsed.medical_history ?? '',

    medications: parsed.medications ?? '',

    allergies: parsed.allergies ?? '',

    smoking_status: parsed.smoking_status ?? '',

    alcohol_consumption: parsed.alcohol_consumption ?? '',

    family_history: parsed.family_history ?? '',

    lifestyle: parsed.lifestyle ?? '',

    risk_factors: parsed.risk_factors ?? '',

    known_hypertension: parsed.known_hypertension ?? null,

    known_diabetes: parsed.known_diabetes ?? null,

    diabetes_type: parsed.diabetes_type ?? null,

    chest_pain: normalizeChestPainAnswer(parsed.chest_pain),

    dyspnea: parsed.dyspnea ?? null,

    snoring: parsed.snoring ?? null,

    follows_treatment: parsed.follows_treatment ?? null,

    current_treatment: parsed.current_treatment ?? '',

    free_notes: parsed.free_notes ?? '',

    clinical_summary: parsed.clinical_summary ?? '',

  };

}



export function clearPersistedAnamnesis(userId: string): void {

  removeWorkflowStorageItem(`${ANAMNESIS_STORAGE_KEY}:${userId}`);

}


