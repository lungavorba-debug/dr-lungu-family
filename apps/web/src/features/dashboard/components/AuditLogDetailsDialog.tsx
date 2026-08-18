import type { AuditLogListItem } from '@medscreen/types';
import { ROLE_LABELS } from '../../shell/config/navigation';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_TYPE_LABELS } from '../lib/audit-labels';

interface AuditLogDetailsDialogProps {
  entry: AuditLogListItem;
  onClose: () => void;
}

export function AuditLogDetailsDialog({ entry, onClose }: AuditLogDetailsDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Detalii eveniment audit</h2>
        <p className="mt-2 text-sm text-slate-600">{entry.description}</p>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Data</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {formatDashboardDateTime(entry.occurred_at)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Acțiune</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {AUDIT_ACTION_LABELS[entry.action]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Utilizator</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{entry.user_name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Rol</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{ROLE_LABELS[entry.role]}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Tip entitate
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">
              {AUDIT_ENTITY_TYPE_LABELS[entry.entity_type]}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              ID entitate
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">
              {entry.entity_id ?? '—'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              ID utilizator
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">{entry.user_id}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">ID eveniment</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-700">{entry.id}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Adresă IP
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{entry.ip_address ?? '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              User agent
            </dt>
            <dd className="mt-1 break-all text-sm text-slate-700">{entry.user_agent ?? '—'}</dd>
          </div>
        </dl>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-touch w-full rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
          >
            Închide
          </button>
        </div>
      </div>
    </div>
  );
}
