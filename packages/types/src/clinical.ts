import type { ClinicalEngineInput, MedicalMeasurements } from './measurements';
import type { PatientGender } from './patient';

export type ClinicalRiskLevel = 'unknown' | 'low' | 'moderate' | 'elevated';

export type ClinicalRiskCategory = 'cardiovascular' | 'diabetes' | 'sleep_apnea';

export interface ClinicalRiskAssessment {
  category: ClinicalRiskCategory;
  level: ClinicalRiskLevel;
  summary: string;
  factors: string[];
  rule_set_id: string;
  /** True when using placeholder/demo rules — not validated clinical logic. */
  is_demo: boolean;
}

export interface ClinicalWarning {
  code: string;
  message: string;
  severity: 'info' | 'attention' | 'critical';
  source_field?: string;
}

export interface ClinicalRecommendation {
  code: string;
  message: string;
  priority: 'routine' | 'soon' | 'urgent';
  category: ClinicalRiskCategory | 'general';
}

export interface ClinicalInterpretationSection {
  title: string;
  content: string;
}

export interface ClinicalInterpretation {
  summary: string;
  sections: ClinicalInterpretationSection[];
}

export interface ClinicalEvaluationResult {
  engine_version: string;
  rule_set_id: string;
  is_demo: boolean;
  evaluated_at: string;
  screening_id: string;
  patient_id: string;
  risks: Record<ClinicalRiskCategory, ClinicalRiskAssessment>;
  warnings: ClinicalWarning[];
  recommendations: ClinicalRecommendation[];
  interpretation: ClinicalInterpretation;
}

/** Anamnesis captured during conversation — session/API payload only. */
export interface ScreeningAnamnesis {
  smoking_status: 'never' | 'former' | 'current' | '';
  alcohol_consumption: 'none' | 'occasional' | 'regular' | '';
  known_diabetes: boolean | null;
  chest_pain: boolean | null;
  dyspnea: boolean | null;
  snoring: boolean | null;
  current_treatment: string;
  free_notes: string;
}

export interface ClinicalEvaluationRequest {
  clinical_engine_input: ClinicalEngineInput;
  patient: {
    age: number;
    gender: PatientGender;
  };
  anamnesis: ScreeningAnamnesis;
  previous_measurements?: Partial<MedicalMeasurements> | null;
}

export interface ClinicalEvaluationResponse {
  evaluation: ClinicalEvaluationResult;
}
