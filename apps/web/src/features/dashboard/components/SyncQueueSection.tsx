import type { ScreeningSyncQueueItem } from '@medscreen/types';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';

const STATUS_LABELS: Record<ScreeningSyncQueueItem['status'], string> = {
  pending: 'În așteptare',
  syncing: 'Se sincronizează',
  synced: 'Sincronizat',
  failed: 'Eșuat',
  conflict: 'Conflict',
};

interface SyncQueueSectionProps {
  title: string;
  description: string;
  items: ScreeningSyncQueueItem[];
  emptyLabel: string;
  onRetry?: (itemId: string) => void;
  retryingItemId?: string | null;
}

export function SyncQueueSection({
  title,
  description,
  items,
  emptyLabel,
  onRetry,
  retryingItemId,
}: SyncQueueSectionProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.patient_name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Operator: {item.operator_name}
                  </p>
                  <p className="mt-1 font-mono text-xs text-slate-500">{item.screening_id}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Adăugat: {formatDashboardDateTime(item.queued_at)}
                  </p>
                  {item.last_attempt_at ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Ultima încercare: {formatDashboardDateTime(item.last_attempt_at)}
                    </p>
                  ) : null}
                  {item.last_error ? (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                      {item.last_error}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.status === 'synced'
                        ? 'bg-emerald-50 text-emerald-700'
                        : item.status === 'failed' || item.status === 'conflict'
                          ? 'bg-red-50 text-red-700'
                          : item.status === 'syncing'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-800'
                    }`}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                  {onRetry ? (
                    <button
                      type="button"
                      disabled={retryingItemId === item.id}
                      onClick={() => onRetry(item.id)}
                      className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
                    >
                      {retryingItemId === item.id ? 'Se reîncearcă...' : 'Reîncearcă'}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
