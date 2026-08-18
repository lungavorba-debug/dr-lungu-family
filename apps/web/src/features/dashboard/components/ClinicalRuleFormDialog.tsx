import { useEffect, useState, type FormEvent } from 'react';
import type { ClinicalRuleListItem } from '@medscreen/types';
import {
  CLINICAL_RULE_CATEGORIES,
  CLINICAL_RULE_SEVERITIES,
  CLINICAL_RULE_TYPES,
} from '@medscreen/types';
import { VALID_THRESHOLD_KEYS } from '@medscreen/shared';
import {
  CLINICAL_RULE_CATEGORY_OPTIONS,
  CLINICAL_RULE_SEVERITY_OPTIONS,
  CLINICAL_RULE_TYPE_OPTIONS,
} from '../lib/clinical-rules-labels';

export interface ClinicalRuleFormValues {
  code: string;
  name: string;
  category: ClinicalRuleListItem['category'];
  severity: ClinicalRuleListItem['severity'];
  rule_type: ClinicalRuleListItem['rule_type'];
  threshold_key: string;
  threshold_value: string;
  threshold_unit: string;
  recommendation_text: string;
}

interface ClinicalRuleFormDialogProps {
  mode: 'create' | 'edit';
  rule?: ClinicalRuleListItem;
  isPending?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: ClinicalRuleFormValues) => void;
  onClose: () => void;
}

const THRESHOLD_KEY_OPTIONS = VALID_THRESHOLD_KEYS.map((key) => ({ value: key, label: key }));

export function ClinicalRuleFormDialog({
  mode,
  rule,
  isPending = false,
  errorMessage,
  onSubmit,
  onClose,
}: ClinicalRuleFormDialogProps) {
  const [code, setCode] = useState(rule?.code ?? '');
  const [name, setName] = useState(rule?.name ?? '');
  const [category, setCategory] = useState<ClinicalRuleListItem['category']>(
    rule?.category ?? CLINICAL_RULE_CATEGORIES.MEASUREMENTS,
  );
  const [severity, setSeverity] = useState<ClinicalRuleListItem['severity']>(
    rule?.severity ?? CLINICAL_RULE_SEVERITIES.ATTENTION,
  );
  const [ruleType, setRuleType] = useState<ClinicalRuleListItem['rule_type']>(
    rule?.rule_type ?? CLINICAL_RULE_TYPES.THRESHOLD,
  );
  const [thresholdKey, setThresholdKey] = useState(rule?.threshold_key ?? THRESHOLD_KEY_OPTIONS[0]?.value ?? '');
  const [thresholdValue, setThresholdValue] = useState(
    rule?.threshold_value !== null && rule?.threshold_value !== undefined ? String(rule.threshold_value) : '',
  );
  const [thresholdUnit, setThresholdUnit] = useState(rule?.threshold_unit ?? '');
  const [recommendationText, setRecommendationText] = useState(rule?.recommendation_text ?? '');

  useEffect(() => {
    if (mode === 'edit' && rule) {
      setCode(rule.code);
      setName(rule.name);
      setCategory(rule.category);
      setSeverity(rule.severity);
      setRuleType(rule.rule_type);
      setThresholdKey(rule.threshold_key ?? THRESHOLD_KEY_OPTIONS[0]?.value ?? '');
      setThresholdValue(rule.threshold_value !== null ? String(rule.threshold_value) : '');
      setThresholdUnit(rule.threshold_unit ?? '');
      setRecommendationText(rule.recommendation_text ?? '');
    }
  }, [mode, rule]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      code: code.trim(),
      name: name.trim(),
      category,
      severity,
      rule_type: ruleType,
      threshold_key: thresholdKey,
      threshold_value: thresholdValue,
      threshold_unit: thresholdUnit.trim(),
      recommendation_text: recommendationText.trim(),
    });
  };

  const showThresholdFields = mode === 'create' ? ruleType === CLINICAL_RULE_TYPES.THRESHOLD : rule?.rule_type === CLINICAL_RULE_TYPES.THRESHOLD;
  const showRecommendationField =
    mode === 'create' ? ruleType === CLINICAL_RULE_TYPES.RECOMMENDATION : rule?.rule_type === CLINICAL_RULE_TYPES.RECOMMENDATION;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === 'create' ? 'Regulă clinică nouă' : 'Editare regulă clinică'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'create'
            ? 'Definiți o regulă nouă pentru setul activ. Modificările intră în vigoare imediat pentru evaluările viitoare.'
            : 'Actualizați pragul, severitatea sau textul recomandării. Versiunea regulii va fi incrementată.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === 'create' ? (
            <>
              <div>
                <label htmlFor="rule-code" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cod
                </label>
                <input
                  id="rule-code"
                  type="text"
                  required
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="ex. pulse.high_custom"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="rule-type" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tip regulă
                  </label>
                  <select
                    id="rule-type"
                    value={ruleType}
                    onChange={(event) => setRuleType(event.target.value as ClinicalRuleListItem['rule_type'])}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                  >
                    {CLINICAL_RULE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="rule-category" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Categorie
                  </label>
                  <select
                    id="rule-category"
                    value={category}
                    onChange={(event) => setCategory(event.target.value as ClinicalRuleListItem['category'])}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                  >
                    {CLINICAL_RULE_CATEGORY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="rule-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Denumire
            </label>
            <input
              id="rule-name"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="rule-severity" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Severitate
              </label>
              <select
                id="rule-severity"
                value={severity}
                onChange={(event) => setSeverity(event.target.value as ClinicalRuleListItem['severity'])}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              >
                {CLINICAL_RULE_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {mode === 'edit' && rule ? (
              <div>
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Tip / categorie</label>
                <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {rule.rule_type} · {rule.category}
                </div>
              </div>
            ) : null}
          </div>

          {showThresholdFields ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {mode === 'create' ? (
                <div className="sm:col-span-3">
                  <label htmlFor="threshold-key" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Cheie prag
                  </label>
                  <select
                    id="threshold-key"
                    value={thresholdKey}
                    onChange={(event) => setThresholdKey(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                  >
                    {THRESHOLD_KEY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">Cheie prag</label>
                  <div className="mt-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700">
                    {rule?.threshold_key ?? '—'}
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="threshold-value" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Valoare prag
                </label>
                <input
                  id="threshold-value"
                  type="number"
                  step="any"
                  required
                  value={thresholdValue}
                  onChange={(event) => setThresholdValue(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="threshold-unit" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unitate
                </label>
                <input
                  id="threshold-unit"
                  type="text"
                  value={thresholdUnit}
                  onChange={(event) => setThresholdUnit(event.target.value)}
                  placeholder="mmHg, bpm, mg/dL…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                />
              </div>
            </div>
          ) : null}

          {showRecommendationField ? (
            <div>
              <label htmlFor="recommendation-text" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Text recomandare
              </label>
              <textarea
                id="recommendation-text"
                required
                rows={4}
                value={recommendationText}
                onChange={(event) => setRecommendationText(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
            >
              {isPending ? 'Se salvează…' : mode === 'create' ? 'Creează regula' : 'Salvează modificările'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
