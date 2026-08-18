import type { ClinicalEvaluationResult, MedicalMeasurements, PatientGender, ScreeningAnamnesis } from '@medscreen/types';

import type { CampaignReportInfo } from './campaign-display';
import type { ScreeningQuestionDisplaySource } from './build-screening-question-display';

/** Screening session input shared by the report composer and web app. */
export interface ClinicalReportInput {
  participant: {
    first_name: string;
    last_name: string;
    gender: PatientGender;
    age: number;
    phone?: string;
    city?: string;
  };
  /** Optional rich anamnesis for participant-facing Q&A display. Falls back to `anamnesis`. */
  screening_display?: ScreeningQuestionDisplaySource;
  campaign: CampaignReportInfo;
  screeningDate: string;
  operatorName: string;
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  evaluation: ClinicalEvaluationResult;
}
