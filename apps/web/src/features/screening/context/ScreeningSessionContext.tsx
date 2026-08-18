import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  ClinicalEngineInput,
  ClinicalEvaluationResult,
  MedicalMeasurements,
  Patient,
} from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { clearPersistedAnamnesis } from '../conversation/lib/anamnesis-storage';
import { clearConversationDraft } from '../conversation/lib/conversation-draft-storage';
import type { StoredScreeningPdf } from '../report/lib/pdf-session-storage';
import { clearScreeningPdf, loadScreeningPdf } from '../report/lib/pdf-session-storage';
import type { StoredParticipantSignature } from '../signature/lib/signature-session-storage';
import {
  clearScreeningSignature,
  loadScreeningSignature,
} from '../signature/lib/signature-session-storage';
import type { AlcoholConsumption, SmokingStatus } from '../conversation/types/conversation-form';
import type { ChestPainAnswer } from '../conversation/lib/screening-questions';
import type { MeasurementsFormState } from '../measurements/types/measurements-form';
import {
  clearScreeningWorkflow,
  loadScreeningWorkflow,
  markScreeningWorkflowCompleted,
  persistScreeningWorkflow,
} from '../lib/screening-session-storage';

export type DiabetesType = 'type1' | 'type2' | 'gestational';

export interface ConversationAnamnesis {
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

interface ScreeningSessionContextValue {
  activePatient: Patient | null;
  anamnesis: ConversationAnamnesis | null;
  aiSessionId: string | null;
  measurements: MedicalMeasurements | null;
  measurementsDraft: MeasurementsFormState | null;
  clinicalEngineInput: ClinicalEngineInput | null;
  clinicalEvaluation: ClinicalEvaluationResult | null;
  generatedPdf: StoredScreeningPdf | null;
  participantSignature: StoredParticipantSignature | null;
  isCompleted: boolean;
  isHydrating: boolean;
  setActivePatientOnly: (patient: Patient) => void;
  setSession: (patient: Patient, anamnesis: ConversationAnamnesis) => void;
  setAiSessionId: (sessionId: string | null) => void;
  setMeasurementsDraft: (draft: MeasurementsFormState | null) => void;
  setMeasurementsSession: (
    measurements: MedicalMeasurements,
    clinicalEngineInput: ClinicalEngineInput,
  ) => void;
  setClinicalEvaluation: (evaluation: ClinicalEvaluationResult) => void;
  setGeneratedPdf: (pdf: StoredScreeningPdf) => void;
  setParticipantSignature: (signature: StoredParticipantSignature) => void;
  markWorkflowCompleted: () => void;
  clearSession: () => void;
}

const ScreeningSessionContext = createContext<ScreeningSessionContextValue | undefined>(
  undefined,
);

function resolveScreeningId(
  clinicalEngineInput: ClinicalEngineInput | null,
  generatedPdf: StoredScreeningPdf | null,
  participantSignature: StoredParticipantSignature | null,
  clinicalEvaluation: ClinicalEvaluationResult | null,
): string | null {
  return (
    clinicalEngineInput?.screening_id ??
    clinicalEvaluation?.screening_id ??
    generatedPdf?.screening_id ??
    participantSignature?.screening_id ??
    null
  );
}

function loadArtifactsForScreening(screeningId: string) {
  return {
    pdf: loadScreeningPdf(screeningId),
    signature: loadScreeningSignature(screeningId),
  };
}

export function ScreeningSessionProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isHydrating, setIsHydrating] = useState(true);
  const [activePatient, setActivePatient] = useState<Patient | null>(null);
  const [anamnesis, setAnamnesis] = useState<ConversationAnamnesis | null>(null);
  const [aiSessionId, setAiSessionIdState] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<MedicalMeasurements | null>(null);
  const [measurementsDraft, setMeasurementsDraftState] = useState<MeasurementsFormState | null>(
    null,
  );
  const [clinicalEngineInput, setClinicalEngineInput] = useState<ClinicalEngineInput | null>(null);
  const [clinicalEvaluation, setClinicalEvaluationState] = useState<ClinicalEvaluationResult | null>(
    null,
  );
  const [generatedPdf, setGeneratedPdfState] = useState<StoredScreeningPdf | null>(null);
  const [participantSignature, setParticipantSignatureState] =
    useState<StoredParticipantSignature | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      setIsHydrating(false);
      return;
    }

    const snapshot = loadScreeningWorkflow(user.id);
    if (!snapshot) {
      setIsHydrating(false);
      return;
    }

    setActivePatient(snapshot.activePatient);
    setAnamnesis(snapshot.anamnesis);
    setAiSessionIdState(snapshot.aiSessionId ?? null);
    setMeasurements(snapshot.measurements);
    setMeasurementsDraftState(snapshot.measurementsDraft);
    setClinicalEngineInput(snapshot.clinicalEngineInput);
    setClinicalEvaluationState(snapshot.clinicalEvaluation);
    setIsCompleted(snapshot.is_completed);

    const screeningId = resolveScreeningId(
      snapshot.clinicalEngineInput,
      null,
      null,
      snapshot.clinicalEvaluation,
    );
    if (screeningId) {
      const { pdf, signature } = loadArtifactsForScreening(screeningId);
      setGeneratedPdfState(pdf);
      setParticipantSignatureState(signature);
    }

    setIsHydrating(false);
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (isHydrating || !user || !activePatient || !anamnesis) {
      return;
    }

    persistScreeningWorkflow(user.id, {
      activePatient,
      anamnesis,
      aiSessionId,
      measurements,
      clinicalEngineInput,
      clinicalEvaluation,
      measurementsDraft,
      is_completed: isCompleted,
    });
  }, [
    activePatient,
    anamnesis,
    aiSessionId,
    measurements,
    measurementsDraft,
    clinicalEngineInput,
    clinicalEvaluation,
    isCompleted,
    isHydrating,
    user,
  ]);

  const setActivePatientOnly = useCallback((patient: Patient) => {
    setActivePatient(patient);
    setAnamnesis(null);
    setMeasurements(null);
    setMeasurementsDraftState(null);
    setClinicalEngineInput(null);
    setClinicalEvaluationState(null);
    setGeneratedPdfState(null);
    setParticipantSignatureState(null);
    setIsCompleted(false);
  }, []);

  const setSession = useCallback((patient: Patient, nextAnamnesis: ConversationAnamnesis) => {
    setActivePatient(patient);
    setAnamnesis(nextAnamnesis);
    setMeasurements(null);
    setMeasurementsDraftState(null);
    setClinicalEngineInput(null);
    setClinicalEvaluationState(null);
    setGeneratedPdfState(null);
    setParticipantSignatureState(null);
    setIsCompleted(false);
  }, []);

  const setAiSessionId = useCallback((sessionId: string | null) => {
    setAiSessionIdState(sessionId);
  }, []);

  const setMeasurementsDraft = useCallback((draft: MeasurementsFormState | null) => {
    setMeasurementsDraftState(draft);
  }, []);

  const setMeasurementsSession = useCallback(
    (nextMeasurements: MedicalMeasurements, nextClinicalEngineInput: ClinicalEngineInput) => {
      setMeasurements(nextMeasurements);
      setClinicalEngineInput(nextClinicalEngineInput);
      setMeasurementsDraftState(null);
      setClinicalEvaluationState(null);
      setGeneratedPdfState(null);
      setParticipantSignatureState(null);
    },
    [],
  );

  const setClinicalEvaluation = useCallback((evaluation: ClinicalEvaluationResult) => {
    setClinicalEvaluationState(evaluation);
    const { pdf, signature } = loadArtifactsForScreening(evaluation.screening_id);
    setGeneratedPdfState(pdf);
    setParticipantSignatureState(signature);
  }, []);

  const setGeneratedPdf = useCallback((pdf: StoredScreeningPdf) => {
    setGeneratedPdfState(pdf);
  }, []);

  const setParticipantSignature = useCallback((signature: StoredParticipantSignature) => {
    setParticipantSignatureState(signature);
  }, []);

  const markWorkflowCompleted = useCallback(() => {
    setIsCompleted(true);
    if (user) {
      markScreeningWorkflowCompleted(user.id);
    }
  }, [user]);

  const clearSession = useCallback(() => {
    const screeningId = resolveScreeningId(
      clinicalEngineInput,
      generatedPdf,
      participantSignature,
      clinicalEvaluation,
    );
    if (screeningId) {
      clearScreeningPdf(screeningId);
      clearScreeningSignature(screeningId);
    }
    if (user) {
      clearScreeningWorkflow(user.id);
      clearPersistedAnamnesis(user.id);
      clearConversationDraft(user.id);
    }
    setActivePatient(null);
    setAnamnesis(null);
    setAiSessionIdState(null);
    setMeasurements(null);
    setMeasurementsDraftState(null);
    setClinicalEngineInput(null);
    setClinicalEvaluationState(null);
    setGeneratedPdfState(null);
    setParticipantSignatureState(null);
    setIsCompleted(false);
  }, [clinicalEngineInput, generatedPdf, participantSignature, clinicalEvaluation, user]);

  const value = useMemo(
    () => ({
      activePatient,
      anamnesis,
      aiSessionId,
      measurements,
      measurementsDraft,
      clinicalEngineInput,
      clinicalEvaluation,
      generatedPdf,
      participantSignature,
      isCompleted,
      isHydrating,
      setActivePatientOnly,
      setSession,
      setAiSessionId,
      setMeasurementsDraft,
      setMeasurementsSession,
      setClinicalEvaluation,
      setGeneratedPdf,
      setParticipantSignature,
      markWorkflowCompleted,
      clearSession,
    }),
    [
      activePatient,
      anamnesis,
      aiSessionId,
      measurements,
      measurementsDraft,
      clinicalEngineInput,
      clinicalEvaluation,
      generatedPdf,
      participantSignature,
      isCompleted,
      isHydrating,
      setActivePatientOnly,
      setSession,
      setAiSessionId,
      setMeasurementsDraft,
      setMeasurementsSession,
      setClinicalEvaluation,
      setGeneratedPdf,
      setParticipantSignature,
      markWorkflowCompleted,
      clearSession,
    ],
  );

  return (
    <ScreeningSessionContext.Provider value={value}>{children}</ScreeningSessionContext.Provider>
  );
}

export function useScreeningSession(): ScreeningSessionContextValue {
  const context = useContext(ScreeningSessionContext);
  if (!context) {
    throw new Error('useScreeningSession must be used within ScreeningSessionProvider');
  }
  return context;
}
