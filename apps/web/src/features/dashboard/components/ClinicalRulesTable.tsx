import type { ClinicalRuleListItem } from '@medscreen/types';
import {
  formatRuleValue,
  getCategoryLabel,
  getRuleTypeLabel,
  getSeverityLabel,
} from '../lib/clinical-rules-labels';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';

interface ClinicalRulesTableProps {
  rules: ClinicalRuleListItem[];
  pendingRuleId?: string | null;
  onEdit: (rule: ClinicalRuleListItem) => void;
  onToggleEnabled: (rule: ClinicalRuleListItem) => void;
  onViewHistory: (rule: ClinicalRuleListItem) => void;
}

export function ClinicalRulesTable({
  rules,
  pendingRuleId,
  onEdit,
  onToggleEnabled,
  onViewHistory,
}: ClinicalRulesTableProps) {
  if (rules.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu există reguli care să corespundă filtrelor selectate.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Regulă</th>
              <th className="px-4 py-3 font-medium">Categorie</th>
              <th className="px-4 py-3 font-medium">Tip</th>
              <th className="px-4 py-3 font-medium">Severitate</th>
              <th className="px-4 py-3 font-medium">Valoare / text</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Versiune</th>
              <th className="px-4 py-3 font-medium">Actualizat</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((rule) => {
              const isPending = pendingRuleId === rule.id;

              return (
                <tr key={rule.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{rule.name}</div>
                    <div className="mt-1 font-mono text-xs text-slate-500">{rule.code}</div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{getCategoryLabel(rule.category)}</td>
                  <td className="px-4 py-4 text-slate-700">{getRuleTypeLabel(rule.rule_type)}</td>
                  <td className="px-4 py-4 text-slate-700">{getSeverityLabel(rule.severity)}</td>
                  <td className="max-w-xs px-4 py-4 text-slate-700">{formatRuleValue(rule)}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        rule.enabled
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rule.enabled ? 'Activă' : 'Inactivă'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-700">v{rule.version}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDashboardDateTime(rule.updated_at)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(rule)}
                        disabled={isPending}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleEnabled(rule)}
                        disabled={isPending}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                      >
                        {rule.enabled ? 'Dezactivează' : 'Activează'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onViewHistory(rule)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Istoric
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
