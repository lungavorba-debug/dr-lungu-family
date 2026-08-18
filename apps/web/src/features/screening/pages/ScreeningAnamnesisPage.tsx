import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ScreeningParticipantBanner } from '../components/ScreeningParticipantBanner';
import { ScreeningStepForwardGuard } from '../components/ScreeningStepForwardGuard';
import { useScreeningSession } from '../context/ScreeningSessionContext';
import { AiFloatingWidget } from '../conversation/components/AiFloatingWidget';
import { AnamnesisCoverageChecklist } from '../conversation/components/AnamnesisCoverageChecklist';
import { AnamnesisContradictionPanel } from '../conversation/components/AnamnesisContradictionPanel';
import { AnamnesisInterviewForm } from '../conversation/components/AnamnesisInterviewForm';
import { ConversationProgress } from '../conversation/components/ConversationProgress';
import { ConversationTranscript } from '../conversation/components/ConversationTranscript';
import { ExtractionReviewPanel } from '../conversation/components/ExtractionReviewPanel';
import { extractAnamnesisFromForm, persistAnamnesis } from '../conversation/lib/anamnesis-storage';
import { SCREENING_QUESTIONS_STEP_TITLE } from '../conversation/lib/screening-questions';
import { useScreeningAnamnesis } from '../conversation/hooks/useScreeningAnamnesis';
import {
  ANAMNESIS_FIELD_LABELS,
  getMissingAnamnesisRequiredFields,
  scrollToAnamnesisField,
} from '../conversation/types/anamnesis-form';
import { useAuth } from '../../auth/context/AuthContext';

export function ScreeningAnamnesisPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePatient, anamnesis, isHydrating, setSession, setAiSessionId } = useScreeningSession();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const {
    form,
    updateField,
    aiStatus,
    transcript,
    assistantStarted,
    recordingSeconds,
    progress,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    retryTranscription,
    isListening,
    isPaused,
    isTranscribing,
    isExtracting,
    isProcessing,
    extraction,
    operatorReviews,
    fieldHints,
    toggleFieldReview,
    transcriptionError,
    recordingError,
    aiMode,
    aiUnavailable,
    aiSessionId,
    missingTopics,
    showCoverageChecklist,
    contradictions,
    acceptContradiction,
    rejectContradiction,
    syncAiSessionBeforeContinue,
  } = useScreeningAnamnesis(anamnesis);

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  if (!activePatient) {
    return <Navigate to="/screening" replace />;
  }

  async function handleContinueToMeasurements() {
    if (submitInFlightRef.current || !activePatient) {
      return;
    }

    setSubmitError(null);

    const missingRequired = getMissingAnamnesisRequiredFields(form);
    if (missingRequired.length > 0) {
      const labels = missingRequired.map((field) => ANAMNESIS_FIELD_LABELS[field]).join(', ');
      setSubmitError(`Lipsesc câmpurile obligatorii: ${labels}`);
      scrollToAnamnesisField(missingRequired[0]);
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      await syncAiSessionBeforeContinue();
      const nextAnamnesis = extractAnamnesisFromForm(form);
      setSession(activePatient, nextAnamnesis);
      if (aiSessionId) {
        setAiSessionId(aiSessionId);
      }
      if (user) {
        persistAnamnesis(user.id, nextAnamnesis);
      }
      navigate('/screening/measurements');
    } catch {
      setSubmitError('Nu s-a putut continua către măsurători.');
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <ScreeningStepForwardGuard step="anamnesis">
      <div className="pb-28">
        <div className="mx-auto max-w-4xl space-y-4">
          <ScreeningParticipantBanner patient={activePatient} stepLabel={SCREENING_QUESTIONS_STEP_TITLE} />

          <header className="rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-medical sm:p-6">
            <Link to="/screening" className="text-sm font-medium text-brand-primary hover:underline">
              ← Înapoi la date participant
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">{SCREENING_QUESTIONS_STEP_TITLE}</h1>
            <p className="mt-2 text-sm text-slate-600">
              Screening cardiovascular rapid pentru evenimente publice. Asistentul AI poate completa
              progresiv răspunsurile din conversația cu participantul.
            </p>
          </header>

          <ConversationTranscript segments={transcript} />

          <ExtractionReviewPanel
            extraction={extraction}
            reviews={operatorReviews}
            onToggleReview={toggleFieldReview}
          />

          <AnamnesisContradictionPanel
            contradictions={contradictions}
            onAccept={acceptContradiction}
            onReject={rejectContradiction}
          />

          {showCoverageChecklist ? (
            <AnamnesisCoverageChecklist missingTopics={missingTopics} />
          ) : null}

          <ConversationProgress
            title={SCREENING_QUESTIONS_STEP_TITLE}
            percent={progress.percent}
            missingRequired={progress.missingRequired}
            missingLabels={ANAMNESIS_FIELD_LABELS}
          />

          <AnamnesisInterviewForm form={form} onChange={updateField} fieldHints={fieldHints} />

          {submitError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleContinueToMeasurements()}
            className="flex min-h-[64px] w-full items-center justify-center rounded-2xl bg-brand-primary text-lg font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Se salvează...' : 'Continuă la măsurători'}
          </button>
        </div>

        <AiFloatingWidget
          aiStatus={aiStatus}
          recordingSeconds={recordingSeconds}
          aiMode={aiMode}
          transcriptionError={transcriptionError}
          recordingError={recordingError}
          aiUnavailable={aiUnavailable}
          isListening={isListening}
          isPaused={isPaused}
          isTranscribing={isTranscribing}
          isExtracting={isExtracting}
          isProcessing={isProcessing}
          assistantStarted={assistantStarted}
          onStart={() => void startRecording()}
          onPause={() => void pauseRecording()}
          onResume={() => void resumeRecording()}
          onStop={() => void stopRecording()}
          onRetryTranscription={() => void retryTranscription()}
        />
      </div>
    </ScreeningStepForwardGuard>
  );
}
