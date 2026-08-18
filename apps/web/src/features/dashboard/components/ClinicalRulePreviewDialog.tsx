import { useState, type FormEvent } from 'react';
import type { PreviewClinicalEvaluationResponse } from '@medscreen/types';
import { usePreviewClinicalEvaluation } from '../hooks/useClinicalRules';

interface ClinicalRulePreviewDialogProps {
  onClose: () => void;
}

export function ClinicalRulePreviewDialog({ onClose }: ClinicalRulePreviewDialogProps) {
  const preview = usePreviewClinicalEvaluation();
  const [result, setResult] = useState<PreviewClinicalEvaluationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [systolic, setSystolic] = useState('165');
  const [diastolic, setDiastolic] = useState('95');
  const [pulse, setPulse] = useState('78');
  const [spo2, setSpo2] = useState('97');
  const [glucose, setGlucose] = useState('112');
  const [bmi, setBmi] = useState('26.8');
  const [age, setAge] = useState('45');
  const [gender, setGender] = useState<'M' | 'F'>('M');
  const [chestPain, setChestPain] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setResult(null);

    try {
      const response = await preview.mutateAsync({
        clinical_engine_input: {
          patient_id: '33333333-3333-4333-8333-333333333333',
          campaign_id: '11111111-1111-4111-8111-111111111111',
          screening_id: '44444444-4444-4444-8444-444444444444',
          captured_at: new Date().toISOString(),
          measurements: {
            systolic_bp: Number(systolic),
            diastolic_bp: Number(diastolic),
            pulse: Number(pulse),
            oxygen_saturation: Number(spo2),
            blood_glucose: Number(glucose),
            blood_glucose_status: 'fasting',
            weight_kg: 82,
            height_cm: 175,
            bmi: Number(bmi),
            ideal_weight_kg: 70.7,
            waist_circumference_cm: 98,
            known_hypertension: false,
            known_diabetes: false,
            current_antihypertensive_treatment: false,
          },
        },
        patient: { age: Number(age), gender },
        anamnesis: {
          smoking_status: '',
          alcohol_consumption: '',
          known_diabetes: null,
          chest_pain: chestPain,
          dyspnea: null,
          snoring: null,
          current_treatment: '',
          free_notes: '',
        },
      });
      setResult(response);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : 'Previzualizarea a eșuat.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Previzualizare evaluare</h2>
            <p className="mt-2 text-sm text-slate-600">
              Rulați motorul clinic cu setul activ de reguli, fără a salva un screening.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Închide
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Sistolică</label>
            <input
              type="number"
              step="any"
              value={systolic}
              onChange={(event) => setSystolic(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Diastolică</label>
            <input
              type="number"
              step="any"
              value={diastolic}
              onChange={(event) => setDiastolic(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Puls</label>
            <input
              type="number"
              step="any"
              value={pulse}
              onChange={(event) => setPulse(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">SpO₂</label>
            <input
              type="number"
              step="any"
              value={spo2}
              onChange={(event) => setSpo2(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Glicemie</label>
            <input
              type="number"
              step="any"
              value={glucose}
              onChange={(event) => setGlucose(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">IMC</label>
            <input
              type="number"
              step="any"
              value={bmi}
              onChange={(event) => setBmi(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Vârstă</label>
            <input
              type="number"
              step="any"
              value={age}
              onChange={(event) => setAge(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Sex</label>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as 'M' | 'F')}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            >
              <option value="M">Masculin</option>
              <option value="F">Feminin</option>
            </select>
          </div>

          <div className="flex items-end">
            <label className="inline-flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={chestPain}
                onChange={(event) => setChestPain(event.target.checked)}
                className="rounded border-slate-300"
              />
              Durere toracică
            </label>
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={preview.isPending}
              className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {preview.isPending ? 'Se evaluează…' : 'Rulează previzualizarea'}
            </button>
          </div>
        </form>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Set: <strong>{result.rule_set.name}</strong> · v{result.rule_set.version} ·{' '}
              {result.rule_set.enabled_count}/{result.rule_set.rule_count} reguli active
            </div>

            <div className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Rezumat</h3>
              <p className="mt-2 text-sm text-slate-700">{result.evaluation.interpretation.summary}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {Object.values(result.evaluation.risks).map((risk) => (
                <div key={risk.category} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-semibold capitalize text-slate-900">{risk.category.replace('_', ' ')}</h3>
                  <p className="mt-2 text-sm text-slate-700">{risk.level}</p>
                  <p className="mt-1 text-xs text-slate-500">{risk.summary}</p>
                </div>
              ))}
            </div>

            {result.evaluation.warnings.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="font-semibold text-amber-900">Avertismente</h3>
                <ul className="mt-2 space-y-2 text-sm text-amber-900">
                  {result.evaluation.warnings.map((warning) => (
                    <li key={warning.code}>{warning.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {result.evaluation.recommendations.length > 0 ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900">Recomandări</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-700">
                  {result.evaluation.recommendations.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
