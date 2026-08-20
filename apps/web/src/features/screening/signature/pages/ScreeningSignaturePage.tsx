import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../../auth/context/AuthContext';
import { useCampaign } from '../../../campaign/context/CampaignContext';
import {
  StickyActionButton,
  StickyScreeningActionBar,
} from '../../components/StickyScreeningActionBar';
import { ScreeningParticipantBanner } from '../../components/ScreeningParticipantBanner';
import { useScreeningSession } from '../../context/ScreeningSessionContext';
import { useGenerateReportPdf } from '../../report/hooks/useGenerateReportPdf';
import { buildClinicalReportProps } from '../../report/lib/build-clinical-report-props';
import { loadScreeningPdf } from '../../report/lib/pdf-session-storage';
import { SignaturePad, type SignaturePadHandle } from '../components/SignaturePad';
import {
  isCanvasBlank,
  loadScreeningSignature,
  persistScreeningSignature,
  signatureFromCanvas,
  signatureToDataUrl,
} from '../lib/signature-session-storage';

export function ScreeningSignaturePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaign } = useCampaign();
  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const {
    activePatient,
    anamnesis,
    measurements,
    clinicalEngineInput,
    clinicalEvaluation,
    generatedPdf,
    participantSignature,
    setGeneratedPdf,
    setParticipantSignature,
    isHydrating,
  } = useScreeningSession();
  const { generate, isGenerating } = useGenerateReportPdf();
  const [hasInk, setHasInk] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const screeningId = clinicalEvaluation?.screening_id ?? generatedPdf?.screening_id ?? null;
  const resolvedPdf = generatedPdf ?? (screeningId ? loadScreeningPdf(screeningId) : null);

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

  useEffect(() => {
    if (participantSignature || !screeningId) return;

    const cached = loadScreeningSignature(screeningId);
    if (cached) {
      setParticipantSignature(cached);
    }
  }, [participantSignature, screeningId, setParticipantSignature]);

  useEffect(() => {
    if (generatedPdf || !resolvedPdf) return;
    setGeneratedPdf(resolvedPdf);
  }, [generatedPdf, resolvedPdf, setGeneratedPdf]);

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  if (!activePatient || !clinicalEvaluation || !anamnesis || !measurements || !clinicalEngineInput) {
    return <Navigate to="/screening/report" replace />;
  }

  if (!activeCampaign || !user || !reportProps) {
    return <Navigate to="/campaigns/select" replace />;
  }

  const participantName = `${activePatient.first_name} ${activePatient.last_name}`;

  if (participantSignature) {
    return <Navigate to="/screening/complete" replace />;
  }

  async function handleSaveSignature() {
    setSaveError(null);
    setSaveMessage(null);

    const canvas = signaturePadRef.current?.getCanvas();
    if (!canvas) {
      setSaveError('Zona de semnătură nu este disponibilă.');
      return;
    }

    if (!hasInk && isCanvasBlank(canvas)) {
      setSaveError('Semnătura participantului este obligatorie.');
      return;
    }

    if (isCanvasBlank(canvas)) {
      setSaveError('Semnătura participantului este obligatorie.');
      return;
    }

    setIsSaving(true);

    try {
      const signature = signatureFromCanvas(canvas, clinicalEvaluation!.screening_id, participantName);
      persistScreeningSignature(clinicalEvaluation!.screening_id, signature);
      setParticipantSignature(signature);

      const signatureDataUrl = signatureToDataUrl(signature);
      const pdf = await generate({
        ...reportProps!,
        participantSignatureDataUrl: signatureDataUrl,
      });

      if (pdf) {
        setGeneratedPdf(pdf);
        setSaveMessage('Semnătura a fost salvată cu succes. PDF-ul final a fost generat.');
      } else {
        setSaveMessage(
          'Semnătura a fost salvată. PDF-ul final va fi regenerat la finalizarea screeningului.',
        );
      }

      navigate('/screening/complete', { replace: true });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Nu s-a putut salva semnătura.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="pb-28">
      <div className="mx-auto max-w-3xl space-y-6">
        <ScreeningParticipantBanner patient={activePatient} stepLabel="Semnătură participant" />

        <Link to="/screening/report" className="text-sm font-medium text-brand-primary hover:underline">
          ← Înapoi la raport
        </Link>

        <header className="rounded-2xl border border-brand-primary/20 bg-white p-6 shadow-medical">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
            Semnătură participant
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Semnătură participant</h1>
          <p className="mt-2 text-sm text-slate-600">
            Rugați participantul să semneze direct pe ecran pentru confirmarea screeningului.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <SignaturePad ref={signaturePadRef} onChange={setHasInk} />
        </section>

        {saveError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        {saveMessage ? (
          <div
            role="status"
            className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm font-medium text-brand-accent"
          >
            {saveMessage}
          </div>
        ) : null}
      </div>

      <StickyScreeningActionBar>
        <StickyActionButton
          disabled={isSaving || isGenerating}
          onClick={() => void handleSaveSignature()}
        >
          {isSaving || isGenerating ? 'Se salvează...' : 'Salvează semnătura'}
        </StickyActionButton>
      </StickyScreeningActionBar>
    </div>
  );
}
