import { Navigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { composeParticipantReport } from '@medscreen/shared';
import { composeScreeningAnamnesis } from '../../conversation/lib/anamnesis-storage';
import type { CompleteScreeningRequest } from '@medscreen/types';
import { useAuth } from '../../../auth/context/AuthContext';
import { useCampaign } from '../../../campaign/context/CampaignContext';
import { ScreeningParticipantBanner } from '../../components/ScreeningParticipantBanner';
import { DeliveryOptionsPanel } from '../../delivery/components/DeliveryOptionsPanel';
import { DeliveryHistoryPanel } from '../../delivery/components/DeliveryHistoryPanel';
import { useReportDelivery } from '../../delivery/hooks/useReportDelivery';
import { useScreeningDeliveries } from '../../delivery/hooks/useScreeningDeliveries';
import { useStartNewScreening } from '../../hooks/useStartNewScreening';
import { useScreeningSession } from '../../context/ScreeningSessionContext';
import { loadScreeningPdf } from '../../report/lib/pdf-session-storage';
import { loadScreeningSignature } from '../../signature/lib/signature-session-storage';
import { buildClinicalReportProps } from '../../report/lib/build-clinical-report-props';
import { useCompleteScreening } from '../hooks/useCompleteScreening';
import { useDeliveryAvailability } from '../../delivery/hooks/useDeliveryAvailability';
import { useClinicSettingsSnapshot } from '../../../settings/context/ClinicSettingsContext';
import { useSyncQueue } from '../../../sync/context/SyncContext';
import { isApiUnavailableError } from '../../../sync/lib/sync-utils';

function CompletionChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-brand-accent/20 bg-brand-accent/5 px-4 py-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg ${
          done ? 'bg-brand-accent text-white' : 'bg-slate-200 text-slate-500'
        }`}
        aria-hidden="true"
      >
        {done ? '✔' : '○'}
      </span>
      <span className="text-base font-medium text-slate-800">{label}</span>
    </li>
  );
}

function mapAnamnesis(anamnesis: NonNullable<ReturnType<typeof useScreeningSession>['anamnesis']>) {
  return composeScreeningAnamnesis(anamnesis);
}

function useCompletionReportProps() {
  const { user } = useAuth();
  const { activeCampaign } = useCampaign();
  const {
    activePatient,
    anamnesis,
    measurements,
    clinicalEvaluation,
    clinicalEngineInput,
  } = useScreeningSession();

  return useMemo(() => {
    if (
      !activePatient ||
      !anamnesis ||
      !measurements ||
      !clinicalEvaluation ||
      !clinicalEngineInput ||
      !activeCampaign ||
      !user
    ) {
      return null;
    }

    return buildClinicalReportProps({
      activePatient,
      anamnesis,
      measurements,
      clinicalEvaluation,
      clinicalEngineInput,
      activeCampaign,
      user,
    });
  }, [
    activePatient,
    anamnesis,
    measurements,
    clinicalEvaluation,
    clinicalEngineInput,
    activeCampaign,
    user,
  ]);
}

export function ScreeningCompletionPage() {
  const startNewScreening = useStartNewScreening();
  const { user } = useAuth();
  const { activeCampaign } = useCampaign();
  const completeScreening = useCompleteScreening();
  const { enqueueScreening } = useSyncQueue();
  const clinicSettingsSnapshot = useClinicSettingsSnapshot();
  const completionReportProps = useCompletionReportProps();
  const persistAttemptedRef = useRef(false);
  const [persistMessage, setPersistMessage] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [queuedLocally, setQueuedLocally] = useState(false);
  const {
    activePatient,
    anamnesis,
    measurements,
    clinicalEvaluation,
    clinicalEngineInput,
    generatedPdf,
    participantSignature,
    setGeneratedPdf,
    setParticipantSignature,
    markWorkflowCompleted,
    isHydrating,
  } = useScreeningSession();

  const screeningId = clinicalEvaluation?.screening_id ?? generatedPdf?.screening_id ?? null;
  const resolvedPdf = generatedPdf ?? (screeningId ? loadScreeningPdf(screeningId) : null);
  const resolvedSignature =
    participantSignature ?? (screeningId ? loadScreeningSignature(screeningId) : null);

  useEffect(() => {
    if (generatedPdf || !resolvedPdf) return;
    setGeneratedPdf(resolvedPdf);
  }, [generatedPdf, resolvedPdf, setGeneratedPdf]);

  useEffect(() => {
    if (participantSignature || !resolvedSignature) return;
    setParticipantSignature(resolvedSignature);
  }, [participantSignature, resolvedSignature, setParticipantSignature]);
  const serverPersisted = Boolean(persistMessage) && !persistError && !queuedLocally;
  const locallyQueued = queuedLocally && Boolean(persistMessage) && !persistError;
  const {
    data: deliveryAvailability,
    isLoading: deliveryAvailabilityLoading,
  } = useDeliveryAvailability(serverPersisted ? screeningId : null);

  const {
    data: deliveryHistory,
    isLoading: deliveryHistoryLoading,
    refetch: refetchDeliveryHistory,
  } = useScreeningDeliveries(serverPersisted ? screeningId : null);

  useEffect(() => {
    if (persistAttemptedRef.current) return;
    if (
      !activePatient ||
      !anamnesis ||
      !measurements ||
      !clinicalEvaluation ||
      !resolvedPdf ||
      !resolvedSignature ||
      !activeCampaign ||
      !user ||
      !completionReportProps
    ) {
      return;
    }

    persistAttemptedRef.current = true;
    setPersistError(null);
    setPersistMessage(null);

    const participantReport = composeParticipantReport(
      {
        participant: completionReportProps.participant,
        campaign: completionReportProps.campaign,
        screeningDate: completionReportProps.screeningDate,
        operatorName: completionReportProps.operatorName,
        measurements: completionReportProps.measurements,
        anamnesis: completionReportProps.anamnesis,
        evaluation: completionReportProps.evaluation,
        screening_display: completionReportProps.screeningDisplay,
      },
      clinicSettingsSnapshot,
    );

    void completeScreening
      .mutateAsync({
        screeningId: clinicalEvaluation.screening_id,
        payload: {
          anamnesis: mapAnamnesis(anamnesis),
          clinical_evaluation: clinicalEvaluation,
          participant_report: participantReport as unknown as CompleteScreeningRequest['participant_report'],
          signature: {
            image_base64: resolvedSignature.image_base64,
            mime_type: resolvedSignature.mime_type,
            signed_at: resolvedSignature.signed_at,
            participant_name: resolvedSignature.participant_name,
          },
          pdf: {
            filename: resolvedPdf.filename,
            mime_type: resolvedPdf.mime_type,
            base64: resolvedPdf.base64,
            generated_at: resolvedPdf.generated_at,
            byte_length: resolvedPdf.byte_length,
            generator_version: resolvedPdf.generator_version,
          },
        },
      })
      .then((result) => {
        markWorkflowCompleted();
        setPersistMessage(
          result.already_completed
            ? 'Screeningul era deja salvat pe server.'
            : 'Screeningul a fost salvat pe server.',
        );
      })
      .catch(async (error: unknown) => {
        if (isApiUnavailableError(error)) {
          await enqueueScreening({
            screeningId: clinicalEvaluation.screening_id,
            userId: user.id,
            campaignId: activeCampaign.id,
            patientId: activePatient.id,
            patientName: `${activePatient.first_name} ${activePatient.last_name}`,
            operatorName: `${user.firstName} ${user.lastName}`,
            measurements,
            measurementsSavedOnServer: true,
            saveMeasurementsPayload: {
              campaign_id: activeCampaign.id,
              patient_id: activePatient.id,
              measurements,
            },
            completePayload: {
              anamnesis: mapAnamnesis(anamnesis),
              clinical_evaluation: clinicalEvaluation,
              participant_report: participantReport as unknown as CompleteScreeningRequest['participant_report'],
              signature: {
                image_base64: resolvedSignature.image_base64,
                mime_type: resolvedSignature.mime_type,
                signed_at: resolvedSignature.signed_at,
                participant_name: resolvedSignature.participant_name,
              },
              pdf: {
                filename: resolvedPdf.filename,
                mime_type: resolvedPdf.mime_type,
                base64: resolvedPdf.base64,
                generated_at: resolvedPdf.generated_at,
                byte_length: resolvedPdf.byte_length,
                generator_version: resolvedPdf.generator_version,
              },
            },
            pdfMetadata: {
              filename: resolvedPdf.filename,
              mime_type: resolvedPdf.mime_type,
              generated_at: resolvedPdf.generated_at,
              byte_length: resolvedPdf.byte_length,
              generator_version: resolvedPdf.generator_version,
            },
          });
          setQueuedLocally(true);
          markWorkflowCompleted();
          setPersistMessage(
            'Screeningul a fost salvat local și va fi sincronizat când conexiunea revine.',
          );
          setPersistError(null);
          return;
        }

        persistAttemptedRef.current = false;
        setPersistError(
          error instanceof Error ? error.message : 'Nu s-a putut salva screeningul pe server.',
        );
      });
  }, [
    activeCampaign,
    activePatient,
    anamnesis,
    clinicalEngineInput,
    clinicalEvaluation,
    clinicSettingsSnapshot,
    completionReportProps,
    completeScreening,
    resolvedPdf,
    measurements,
    resolvedSignature,
    user,
    markWorkflowCompleted,
    enqueueScreening,
  ]);

  const { options, deliver, activeChannel, lastMessage, lastSuccess } = useReportDelivery({
    pdf: resolvedPdf,
    patient: activePatient,
    screeningId,
    campaignName: activeCampaign?.name,
    channelAvailability: deliveryAvailability?.channels,
    onDelivered: () => {
      void refetchDeliveryHistory();
    },
  });

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  if (!activePatient || !clinicalEvaluation || !resolvedPdf) {
    return <Navigate to="/screening/report" replace />;
  }

  if (!resolvedSignature) {
    return <Navigate to="/screening/signature" replace />;
  }

  return (
    <div className="pb-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <ScreeningParticipantBanner patient={activePatient} stepLabel="Screening finalizat" />

        <header className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-6 shadow-medical">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
            Screening finalizat
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Participantul poate primi raportul sau puteți începe imediat un screening nou.
          </p>
        </header>

        <section aria-label="Status screening finalizat">
          <ul className="space-y-3">
            <CompletionChecklistItem label="Screening finalizat" done />
            <CompletionChecklistItem label="Raport generat" done={Boolean(resolvedPdf)} />
            <CompletionChecklistItem label="Semnătură salvată" done={Boolean(resolvedSignature)} />
            <CompletionChecklistItem
              label="Salvat pe server"
              done={serverPersisted}
            />
            <CompletionChecklistItem
              label="Salvat local pentru sincronizare"
              done={locallyQueued}
            />
          </ul>
        </section>

        {completeScreening.isPending && !persistMessage ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Se salvează screeningul pe server...
          </div>
        ) : null}

        {persistMessage ? (
          <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
            {persistMessage}
          </div>
        ) : null}

        {persistError ? (
          <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p>{persistError}</p>
            <button
              type="button"
              onClick={() => {
                persistAttemptedRef.current = false;
                setPersistError(null);
              }}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Reîncearcă salvarea
            </button>
          </div>
        ) : null}

        <DeliveryOptionsPanel
          options={options}
          activeChannel={activeChannel}
          lastMessage={lastMessage}
          lastSuccess={lastSuccess}
          emailAvailabilityLoading={deliveryAvailabilityLoading}
          whatsappAvailabilityLoading={deliveryAvailabilityLoading}
          defaultPhone={activePatient.phone}
          participantDisplayName={`${activePatient.last_name} ${activePatient.first_name}`}
          campaignName={activeCampaign?.name}
          onDeliver={(channel, recipient) => void deliver(channel, recipient)}
        />

        <DeliveryHistoryPanel
          deliveries={deliveryHistory?.deliveries ?? []}
          isLoading={deliveryHistoryLoading}
        />

        <button
          type="button"
          onClick={startNewScreening}
          className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary text-lg font-bold text-white shadow-medical transition hover:bg-brand-secondary"
        >
          <span aria-hidden="true">➕</span>
          Screening nou
        </button>
      </div>
    </div>
  );
}
