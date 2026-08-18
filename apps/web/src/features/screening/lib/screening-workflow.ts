import type { StoredScreeningPdf } from '../report/lib/pdf-session-storage';
import type { StoredParticipantSignature } from '../signature/lib/signature-session-storage';
import type { ConversationAnamnesis } from '../context/ScreeningSessionContext';
import type {
  ClinicalEngineInput,
  ClinicalEvaluationResult,
  MedicalMeasurements,
  Patient,
} from '@medscreen/types';

export type ScreeningWorkflowStep =
  | 'conversation'
  | 'anamnesis'
  | 'measurements'
  | 'results'
  | 'report'
  | 'signature'
  | 'complete';

export const SCREENING_STEP_PATH: Record<ScreeningWorkflowStep, string> = {
  conversation: '/screening',
  anamnesis: '/screening/anamnesis',
  measurements: '/screening/measurements',
  results: '/screening/results',
  report: '/screening/report',
  signature: '/screening/signature',
  complete: '/screening/complete',
};

const STEP_ORDER: ScreeningWorkflowStep[] = [
  'conversation',
  'anamnesis',
  'measurements',
  'results',
  'report',
  'signature',
  'complete',
];

export interface ScreeningWorkflowSession {
  activePatient: Patient | null;
  anamnesis: ConversationAnamnesis | null;
  measurements: MedicalMeasurements | null;
  clinicalEngineInput: ClinicalEngineInput | null;
  clinicalEvaluation: ClinicalEvaluationResult | null;
  generatedPdf: StoredScreeningPdf | null;
  participantSignature: StoredParticipantSignature | null;
  isCompleted?: boolean;
}

export function resolveScreeningWorkflowStep(
  session: ScreeningWorkflowSession,
): ScreeningWorkflowStep {
  if (session.participantSignature) {
    return 'complete';
  }
  if (session.generatedPdf) {
    return 'signature';
  }
  if (session.clinicalEvaluation) {
    return 'report';
  }
  if (session.clinicalEngineInput && session.measurements) {
    return 'results';
  }
  if (session.activePatient && session.anamnesis) {
    return 'measurements';
  }
  if (session.activePatient) {
    return 'anamnesis';
  }
  return 'conversation';
}

/** Redirect forward when an earlier step is visited after data was committed (C2). */
export function getCommittedStepForwardRedirect(
  pageStep: ScreeningWorkflowStep,
  session: ScreeningWorkflowSession,
): string | null {
  if (session.isCompleted) {
    return pageStep === 'complete' ? null : SCREENING_STEP_PATH.complete;
  }

  const furthestStep = resolveScreeningWorkflowStep(session);
  const pageIndex = STEP_ORDER.indexOf(pageStep);
  const furthestIndex = STEP_ORDER.indexOf(furthestStep);

  if (furthestIndex <= pageIndex) {
    return null;
  }

  if (pageStep === 'conversation' && furthestStep !== 'conversation') {
    return SCREENING_STEP_PATH[furthestStep];
  }

  if (pageStep === 'anamnesis' && session.anamnesis) {
    return SCREENING_STEP_PATH.measurements;
  }

  if (pageStep === 'measurements' && session.clinicalEngineInput && session.measurements) {
    return SCREENING_STEP_PATH.results;
  }

  return null;
}
