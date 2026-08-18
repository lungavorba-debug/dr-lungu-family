import type { ClinicalRuleChangeItem, ClinicalRuleListItem } from '@medscreen/types';
import { CLINICAL_RULE_CHANGE_TYPE_LABELS } from '../lib/clinical-rules-labels';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';
import { useClinicalRuleHistory } from '../hooks/useClinicalRules';

interface ClinicalRuleHistoryDialogProps {
  rule?: ClinicalRuleListItem | null;
  onClose: () => void;
}

function ChangeDetails({ change }: { change: ClinicalRuleChangeItem }) {
  const previous = change.previous_value;
  const next = change.new_value;

  return (
    <div className="mt-2 space-y-1 text-xs text-slate-600">
      {previous?.threshold_value !== undefined || next?.threshold_value !== undefined ? (
        <p>
          Prag: {String(previous?.threshold_value ?? '—')} → {String(next?.threshold_value ?? '—')}
        </p>
      ) : null}
      {previous?.enabled !== undefined || next?.enabled !== undefined ? (
        <p>
          Status: {String(previous?.enabled ?? '—')} → {String(next?.enabled ?? '—')}
        </p>
      ) : null}
      {typeof next?.name === 'string' ? <p>Denumire: {next.name}</p> : null}
    </div>
  );
}

export function ClinicalRuleHistoryDialog({ rule, onClose }: ClinicalRuleHistoryDialogProps) {
  const { data, isLoading, isError } = useClinicalRuleHistory({
    ruleId: rule?.id,
    page: 1,
    limit: 20,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Istoric modificări</h2>
            <p className="mt-2 text-sm text-slate-600">
              {rule
                ? `Versiuni și modificări pentru ${rule.name} (${rule.code}).`
                : 'Istoricul complet al setului activ de reguli clinice.'}
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

        <div className="mt-6 space-y-3">
          {isLoading ? <p className="text-sm text-slate-500">Se încarcă istoricul…</p> : null}
          {isError ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Istoricul nu a putut fi încărcat.
            </p>
          ) : null}

          {data?.changes.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nu există înregistrări în istoric.
            </div>
          ) : null}

          {data?.changes.map((change) => (
            <div key={change.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {change.rule_name}{' '}
                    <span className="font-normal text-slate-500">({change.rule_code})</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {CLINICAL_RULE_CHANGE_TYPE_LABELS[change.change_type] ?? change.change_type} · v
                    {change.version} · {change.changed_by_name}
                  </p>
                </div>
                <p className="text-xs text-slate-500">{formatDashboardDateTime(change.occurred_at)}</p>
              </div>
              <ChangeDetails change={change} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
