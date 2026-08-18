import type { AuditLogListItem } from '@medscreen/types';
import { ROLE_LABELS } from '../../shell/config/navigation';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS } from '../lib/audit-labels';

interface AuditLogsTableProps {
  entries: AuditLogListItem[];
  onSelect: (entry: AuditLogListItem) => void;
}

export function AuditLogsTable({ entries, onSelect }: AuditLogsTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu există evenimente care să corespundă filtrelor selectate.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Utilizator</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Acțiune</th>
              <th className="px-4 py-3 font-medium">Entitate</th>
              <th className="px-4 py-3 font-medium">Descriere</th>
              <th className="px-4 py-3 font-medium">Detalii</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-4 text-slate-700">
                  {formatDashboardDateTime(entry.occurred_at)}
                </td>
                <td className="px-4 py-4 font-semibold text-slate-900">{entry.user_name}</td>
                <td className="px-4 py-4 text-slate-700">{ROLE_LABELS[entry.role]}</td>
                <td className="px-4 py-4 text-slate-700">{AUDIT_ACTION_LABELS[entry.action]}</td>
                <td className="px-4 py-4 text-slate-700">
                  {AUDIT_ENTITY_TYPE_LABELS[entry.entity_type]}
                  {entry.entity_id ? (
                    <span className="mt-1 block font-mono text-xs text-slate-500">
                      {entry.entity_id}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-slate-700">{entry.description}</td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => onSelect(entry)}
                    className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary"
                  >
                    Vezi
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
