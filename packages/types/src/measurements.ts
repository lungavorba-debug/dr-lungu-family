export type BloodGlucoseStatus = 'fasting' | 'non_fasting' | '';

export interface MedicalMeasurements {
  systolic_bp: number | null;
  diastolic_bp: number | null;
  pulse: number | null;
  oxygen_saturation: number | null;
  blood_glucose: number | null;
  blood_glucose_status: BloodGlucoseStatus;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number | null;
  ideal_weight_kg: number | null;
  waist_circumference_cm: number | null;
  known_hypertension: boolean | null;
  known_diabetes: boolean | null;
  current_antihypertensive_treatment: boolean | null;
}

import type { ScreeningAnamnesis } from './clinical';

export interface SaveMeasurementsRequest {
  campaign_id: string;
  patient_id: string;
  measurements: MedicalMeasurements;
  ai_session_id?: string;
  anamnesis?: ScreeningAnamnesis;
}

export interface SaveMeasurementsResponse {
  screening_id: string;
  measurements: MedicalMeasurements;
  clinical_engine_input: ClinicalEngineInput;
}

export interface PreviousMeasurementsResponse {
  previous: Partial<MedicalMeasurements> | null;
  previous_date: string | null;
}

/** Bundle prepared for the future Clinical Engine — no risk calculation here. */
export interface ClinicalEngineInput {
  patient_id: string;
  campaign_id: string;
  screening_id: string;
  measurements: MedicalMeasurements;
  captured_at: string;
}
