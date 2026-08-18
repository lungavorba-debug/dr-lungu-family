import type {

  ClinicalEvaluationResult,

  MedicalMeasurements,

  Patient,

  ScreeningAnamnesis,

} from '@medscreen/types';

import type { ScreeningQuestionDisplaySource } from '@medscreen/shared';



export interface ClinicalReportParticipant {

  first_name: string;

  last_name: string;

  gender: Patient['gender'];

  age: number;

  phone?: string;

  city?: string;

}



export interface ClinicalReportCampaign {

  name: string;

  work_point: string;

  edition?: string | null;

  description?: string | null;

}



export interface ClinicalReportProps {

  participant: ClinicalReportParticipant;

  campaign: ClinicalReportCampaign;

  screeningDate: string;

  operatorName: string;

  measurements: MedicalMeasurements;

  anamnesis: ScreeningAnamnesis;

  evaluation: ClinicalEvaluationResult;

  /** Rich anamnesis for participant-facing screening Q&A display. */

  screeningDisplay?: ScreeningQuestionDisplaySource;

  /** Optional captured signature image (data URL). */

  participantSignatureDataUrl?: string | null;

  /** When true, hides operator navigation chrome — useful for future PDF export. */

  presentationMode?: 'screen' | 'print';

}

