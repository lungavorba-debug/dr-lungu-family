import type {
  AuthUser,
  Campaign,
  ClinicalEngineInput,
  ClinicalEvaluationResult,
  MedicalMeasurements,
  Patient,
} from '@medscreen/types';
import { composeScreeningAnamnesis } from '../../conversation/lib/anamnesis-storage';
import type { ConversationAnamnesis } from '../../context/ScreeningSessionContext';
import type { ClinicalReportProps } from '../types/clinical-report-props';

interface BuildClinicalReportPropsInput {
  activePatient: Patient;
  anamnesis: ConversationAnamnesis;
  measurements: MedicalMeasurements;
  clinicalEvaluation: ClinicalEvaluationResult;
  clinicalEngineInput: ClinicalEngineInput | null;
  activeCampaign: Campaign;
  user: Pick<AuthUser, 'firstName' | 'lastName'>;
  participantSignatureDataUrl?: string | null;
}

export function buildClinicalReportProps(
  input: BuildClinicalReportPropsInput,
): ClinicalReportProps {
  return {
    participant: {
      first_name: input.activePatient.first_name,
      last_name: input.activePatient.last_name,
      gender: input.activePatient.gender,
      age: input.activePatient.age,
      phone: input.activePatient.phone,
      city: input.activePatient.city,
    },
    campaign: {
      name: input.activeCampaign.name,
      work_point: input.activeCampaign.work_point,
      edition: input.activeCampaign.edition,
      description: input.activeCampaign.description,
    },
    screeningDate: input.clinicalEvaluation.evaluated_at || input.clinicalEngineInput!.captured_at,
    operatorName: `${input.user.firstName} ${input.user.lastName}`,
    measurements: input.measurements,
    anamnesis: composeScreeningAnamnesis(input.anamnesis),
    screeningDisplay: input.anamnesis,
    evaluation: input.clinicalEvaluation,
    participantSignatureDataUrl: input.participantSignatureDataUrl ?? null,
  };
}
