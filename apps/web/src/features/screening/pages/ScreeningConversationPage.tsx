import { useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { createPatientSchema } from '@medscreen/shared';
import type { Patient } from '@medscreen/types';
import { ApiClientError } from '../../../shared/lib/api-client';
import { useAuth } from '../../auth/context/AuthContext';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { usePatientContext } from '../../patients/context/PatientContext';
import { useCreatePatient } from '../../patients/hooks/usePatientQueries';
import { ScreeningParticipantBanner } from '../components/ScreeningParticipantBanner';
import { ScreeningStepForwardGuard } from '../components/ScreeningStepForwardGuard';
import { useScreeningSession } from '../context/ScreeningSessionContext';
import { clearConversationDraft } from '../conversation/lib/conversation-draft-storage';
import {
  CONVERSATION_FIELD_LABELS,
  getMissingConversationRequiredFields,
  scrollToConversationField,
} from '../conversation/types/conversation-form';
import { ConversationProgress } from '../conversation/components/ConversationProgress';
import { ExistingPatientBanner } from '../conversation/components/ExistingPatientBanner';
import { DemographicsForm } from '../conversation/components/DemographicsForm';
import { VoiceScreeningAssistantButton } from '../conversation/components/VoiceScreeningAssistantButton';
import { applyVoiceExtractionToDemographics, type DemographicsFieldHints } from '../conversation/lib/apply-voice-extraction';
import { useVoiceScreeningAssistant } from '../conversation/hooks/useVoiceScreeningAssistant';
import { useScreeningDemographics } from '../conversation/hooks/useScreeningDemographics';

export function ScreeningConversationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaign, isLoading: campaignLoading } = useCampaign();
  const { setActivePatient } = usePatientContext();
  const { setActivePatientOnly, isHydrating, activePatient } = useScreeningSession();
  const createPatient = useCreatePatient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const {
    form,
    updateField,
    progress,
    existingPatient,
    isSearchingPatient,
    usingExistingPatient,
    continueWithExistingPatient,
    clearConversationDraftForUser,
    setForm,
  } = useScreeningDemographics();

  const voiceAssistant = useVoiceScreeningAssistant();
  const [fieldHints, setFieldHints] = useState<DemographicsFieldHints>({});

  async function handleStopVoiceAssistant() {
    const result = await voiceAssistant.stopRecording();
    if (!result) return;
    const merged = applyVoiceExtractionToDemographics(form, result.extraction);
    setForm(merged.form);
    setFieldHints((current) => ({ ...current, ...merged.hints }));
  }

  if (!campaignLoading && !activeCampaign) {
    return <Navigate to="/campaigns/select" replace />;
  }

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  async function handleContinueToAnamnesis() {
    if (submitInFlightRef.current) return;

    setSubmitError(null);

    const missingRequired = getMissingConversationRequiredFields(form);
    if (missingRequired.length > 0) {
      const labels = missingRequired.map((field) => CONVERSATION_FIELD_LABELS[field]).join(', ');
      setSubmitError(`Lipsesc câmpurile obligatorii: ${labels}`);
      scrollToConversationField(missingRequired[0]);
      return;
    }

    const parsed = createPatientSchema.safeParse({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      age: form.age,
      gender: form.gender || undefined,
      city: form.city,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.errors[0];
      setSubmitError(firstIssue?.message ?? 'Completați câmpurile obligatorii înainte de a continua.');
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      let patient: Patient | null =
        existingPatient && existingPatient.phone === parsed.data.phone ? existingPatient : null;

      if (!patient) {
        const created = await createPatient.mutateAsync(parsed.data);
        patient = created.patient;
      }

      setActivePatient(patient);
      setActivePatientOnly(patient);
      if (user) {
        clearConversationDraft(user.id);
        clearConversationDraftForUser();
      }

      navigate('/screening/anamnesis');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Nu s-a putut continua către interviul medical.');
      }
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <ScreeningStepForwardGuard step="conversation">
      <div className="pb-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <ScreeningParticipantBanner
            patient={activePatient ?? existingPatient}
            preview={
              !activePatient && !existingPatient && form.first_name && form.last_name
                ? {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    age: form.age ? Number.parseInt(form.age, 10) : undefined,
                    phone: form.phone || undefined,
                  }
                : null
            }
            stepLabel="Date participant"
          />

          <header className="rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-medical sm:p-6">
            <Link to="/" className="text-sm font-medium text-brand-primary hover:underline">
              ← Înapoi la panou
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Screening — Date participant</h1>
            <p className="mt-2 text-sm text-slate-600">
              Completați datele participantului. Urmează întrebările de screening cardiovascular.
            </p>
          </header>

          {existingPatient && !usingExistingPatient ? (
            <ExistingPatientBanner
              patient={existingPatient}
              isSearching={isSearchingPatient}
              onContinueWithExisting={continueWithExistingPatient}
            />
          ) : null}

          <ConversationProgress
            title="Date participant"
            percent={progress.percent}
            missingRequired={progress.missingRequired}
            missingLabels={CONVERSATION_FIELD_LABELS}
          />

          <VoiceScreeningAssistantButton
            status={voiceAssistant.status}
            recordingSeconds={voiceAssistant.recordingSeconds}
            error={voiceAssistant.error}
            aiLoading={voiceAssistant.aiLoading}
            aiUnavailable={voiceAssistant.aiUnavailable}
            aiProvider={voiceAssistant.aiProvider}
            isSupported={voiceAssistant.isSupported}
            onStart={() => void voiceAssistant.startRecording()}
            onStop={() => void handleStopVoiceAssistant()}
            onRefreshAi={() => void voiceAssistant.refreshAiAvailability()}
          />

          <DemographicsForm form={form} fieldHints={fieldHints} onChange={updateField} />

          {submitError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submitError}
            </div>
          ) : null}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => void handleContinueToAnamnesis()}
            className="flex min-h-[64px] w-full items-center justify-center rounded-2xl bg-brand-primary text-lg font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Se salvează...' : 'Continuă la întrebări screening'}
          </button>
        </div>
      </div>
    </ScreeningStepForwardGuard>
  );
}
