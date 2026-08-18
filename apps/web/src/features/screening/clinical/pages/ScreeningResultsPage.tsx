import { useCallback, useEffect, useRef, useState } from 'react';

import { Link, Navigate, useNavigate } from 'react-router-dom';

import type { ClinicalEvaluationRequest } from '@medscreen/types';

import { composeScreeningAnamnesis } from '../../conversation/lib/anamnesis-storage';

import { ApiClientError } from '../../../../shared/lib/api-client';

import { ScreeningParticipantBanner } from '../../components/ScreeningParticipantBanner';

import { useScreeningSession } from '../../context/ScreeningSessionContext';

import {

  ClinicalInterpretationPanel,

  ClinicalRecommendationsList,

  ClinicalWarningsList,

  RiskAssessmentCard,

} from '../components/ClinicalResultSections';

import { useEvaluateClinicalEngine } from '../hooks/useClinicalEvaluation';



export function ScreeningResultsPage() {

  const navigate = useNavigate();

  const {

    activePatient,

    anamnesis,

    clinicalEngineInput,

    clinicalEvaluation,

    setClinicalEvaluation,

  } = useScreeningSession();

  const evaluateClinical = useEvaluateClinicalEngine();

  const [error, setError] = useState<string | null>(null);

  const [isRetrying, setIsRetrying] = useState(false);

  const autoRunCompleted = useRef(false);



  const runEvaluation = useCallback(async () => {

    if (!clinicalEngineInput || !activePatient || !anamnesis) {

      return;

    }



    const payload: ClinicalEvaluationRequest = {

      clinical_engine_input: clinicalEngineInput,

      patient: {

        age: activePatient.age,

        gender: activePatient.gender,

      },

      anamnesis: composeScreeningAnamnesis(anamnesis),

    };



    setError(null);

    setIsRetrying(true);



    try {

      const result = await evaluateClinical.mutateAsync(payload);

      setClinicalEvaluation(result.evaluation);

    } catch (err) {

      if (err instanceof ApiClientError) {

        setError(err.message);

      } else {

        setError('Nu s-a putut genera evaluarea clinică.');

      }

    } finally {

      setIsRetrying(false);

    }

  }, [activePatient, anamnesis, clinicalEngineInput, evaluateClinical, setClinicalEvaluation]);



  useEffect(() => {

    if (clinicalEvaluation || autoRunCompleted.current) return;

    if (!clinicalEngineInput || !activePatient || !anamnesis) return;



    autoRunCompleted.current = true;

    void runEvaluation();

  }, [activePatient, anamnesis, clinicalEngineInput, clinicalEvaluation, runEvaluation]);



  if (!activePatient || !clinicalEngineInput || !anamnesis) {

    return <Navigate to="/screening" replace />;

  }



  const evaluation = clinicalEvaluation;

  const isLoading = (!evaluation && !error) || isRetrying;



  return (

    <div className="pb-8">

      <div className="mx-auto max-w-4xl space-y-4">

        <ScreeningParticipantBanner patient={activePatient} stepLabel="Rezultat clinic" />

        <header className="rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-medical sm:p-6">

          <Link to="/screening/measurements" className="text-sm font-medium text-brand-primary hover:underline">

            ← Înapoi la măsurători

          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">Rezultat clinic</h1>

          <p className="mt-1 text-xs text-slate-500">
            Conversație → Măsurători → Evaluare → Raport participant
          </p>
        </header>

        {isLoading ? (

          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">

            Se generează evaluarea clinică...

          </div>

        ) : null}



        {error ? (

          <div className="space-y-3">

            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

              {error}

            </div>

            <button

              type="button"

              disabled={isRetrying}

              onClick={() => void runEvaluation()}

              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-50"

            >

              {isRetrying ? 'Se reîncearcă...' : 'Reîncearcă evaluarea'}

            </button>

          </div>

        ) : null}



        {evaluation ? (

          <>

            <section className="grid gap-4 md:grid-cols-3">

              <RiskAssessmentCard assessment={evaluation.risks.cardiovascular} />

              <RiskAssessmentCard assessment={evaluation.risks.diabetes} />

              <RiskAssessmentCard assessment={evaluation.risks.sleep_apnea} />

            </section>



            <ClinicalInterpretationPanel interpretation={evaluation.interpretation} />

            <ClinicalWarningsList warnings={evaluation.warnings} />

            <ClinicalRecommendationsList recommendations={evaluation.recommendations} />

            <button
              type="button"
              onClick={() => navigate('/screening/report')}
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary"
            >
              Raport pentru participant →
            </button>

          </>

        ) : null}

      </div>

    </div>

  );

}


