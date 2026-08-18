import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../../auth/context/AuthContext';
import { useCampaign } from '../../../campaign/context/CampaignContext';
import { ScreeningParticipantBanner } from '../../components/ScreeningParticipantBanner';
import {
  StickyActionButton,
  StickyScreeningActionBar,
} from '../../components/StickyScreeningActionBar';
import { useScreeningSession } from '../../context/ScreeningSessionContext';
import { signatureToDataUrl } from '../../signature/lib/signature-session-storage';
import { ClinicalReport } from '../components/ClinicalReport';
import { useGenerateReportPdf } from '../hooks/useGenerateReportPdf';
import { buildClinicalReportProps } from '../lib/build-clinical-report-props';
import { clearScreeningPdf, downloadStoredPdf, persistScreeningPdf } from '../lib/pdf-session-storage';

export function ScreeningReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaign } = useCampaign();
  const {
    activePatient,
    anamnesis,
    measurements,
    clinicalEvaluation,
    clinicalEngineInput,
    generatedPdf,
    setGeneratedPdf,
    participantSignature,
    isHydrating,
  } = useScreeningSession();
  const { generate, isGenerating, error: generateError } = useGenerateReportPdf();
  const autoGenerateAttempted = useRef(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const participantSignatureDataUrl = useMemo(() => {
    if (!participantSignature) return null;
    return signatureToDataUrl(participantSignature);
  }, [participantSignature]);

  const reportProps = useMemo(() => {
    if (!activePatient || !anamnesis || !measurements || !clinicalEvaluation || !activeCampaign || !user) {
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
      participantSignatureDataUrl,
    });
  }, [
    activePatient,
    anamnesis,
    measurements,
    clinicalEvaluation,
    clinicalEngineInput,
    activeCampaign,
    user,
    participantSignatureDataUrl,
  ]);

  useEffect(() => {
    if (!reportProps || !clinicalEvaluation || isGenerating || autoGenerateAttempted.current) {
      return;
    }

    autoGenerateAttempted.current = true;

    void (async () => {
      const pdf = await generate(reportProps);
      if (pdf) {
        setGeneratedPdf(pdf);
        setActionMessage('PDF generat.');
      }
    })();
  }, [clinicalEvaluation, generate, isGenerating, reportProps, setGeneratedPdf]);

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  if (!activePatient || !anamnesis || !measurements || !clinicalEvaluation || !clinicalEngineInput) {
    return <Navigate to="/screening" replace />;
  }

  if (!activeCampaign || !user || !reportProps) {
    return <Navigate to="/campaigns/select" replace />;
  }

  async function handleRegeneratePdf() {
    setActionMessage(null);

    if (clinicalEvaluation) {
      clearScreeningPdf(clinicalEvaluation.screening_id);
    }

    const pdf = await generate(reportProps!);

    if (pdf) {
      setGeneratedPdf(pdf);
      setActionMessage('PDF regenerat.');
    }
  }

  function handleDownloadPdf() {
    if (!generatedPdf) return;

    downloadStoredPdf(generatedPdf);
    setActionMessage('PDF descărcat.');
  }

  function handleContinueToSignature() {
    if (clinicalEvaluation && generatedPdf) {
      persistScreeningPdf(clinicalEvaluation.screening_id, generatedPdf);
    }

    navigate('/screening/signature');
  }

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-4xl space-y-4">
        <ScreeningParticipantBanner patient={activePatient} stepLabel="Raport participant" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/screening/results" className="text-sm font-medium text-brand-primary hover:underline">
            ← Înapoi la rezultat operator
          </Link>

          <button
            type="button"
            disabled={isGenerating || !generatedPdf}
            onClick={() => void handleRegeneratePdf()}
            className="min-h-touch self-start rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {isGenerating ? 'Se generează PDF...' : 'Regenerează PDF'}
          </button>
        </div>

        {generateError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-medium">Previzualizarea PDF nu a putut fi generată.</p>
            <p className="mt-1">{generateError}</p>
            <p className="mt-2 text-xs text-red-600">
              Puteți continua la semnătură — PDF-ul final cu semnătură se va genera după salvare.
            </p>
          </div>
        ) : null}

        {actionMessage ? (
          <div className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
            {actionMessage}
            {generatedPdf ? (
              <p className="mt-1 text-xs text-slate-600">
                {generatedPdf.filename} · {(generatedPdf.byte_length / 1024).toFixed(1)} KB
              </p>
            ) : null}
          </div>
        ) : null}

        {isGenerating && !generatedPdf ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            Se generează PDF-ul raportului...
          </div>
        ) : null}

        <ClinicalReport {...reportProps} participantSignatureDataUrl={participantSignatureDataUrl} />
      </div>

      <StickyScreeningActionBar>
        <StickyActionButton
          variant="secondary"
          disabled={!generatedPdf || isGenerating}
          onClick={handleDownloadPdf}
        >
          Descarcă PDF
        </StickyActionButton>

        <StickyActionButton
          variant="accent"
          disabled={isGenerating}
          onClick={handleContinueToSignature}
        >
          {isGenerating ? 'Se generează PDF...' : 'Continuă la semnătură →'}
        </StickyActionButton>
      </StickyScreeningActionBar>
    </div>
  );
}
