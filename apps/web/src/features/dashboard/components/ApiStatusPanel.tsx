import { ConnectionStatusBadge } from '../../../shared/components/ConnectionStatusBadge';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { useApiHealth } from '../hooks/useApiHealth';

function formatCheckedAt(iso: string | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}

function formatUptime(seconds: number | undefined): string {
  if (seconds == null) return '—';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function ApiStatusPanel() {
  const { status, label, isOnline, recheck } = useConnectionStatus();
  const { data, isFetching, refetch, dataUpdatedAt } = useApiHealth();

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Stare conexiune">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Stare conexiune</h2>
          <p className="mt-1 text-sm text-slate-500">
            Verificare automată a serverului MedScreen și a rețelei locale.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            recheck();
            void refetch();
          }}
          disabled={isFetching}
          className="inline-flex min-h-touch items-center justify-center rounded-xl border border-brand-primary/25 px-4 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/5 disabled:opacity-60"
        >
          {isFetching ? 'Se verifică...' : 'Verifică acum'}
        </button>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Indicator aplicație</dt>
          <dd className="mt-2">
            <ConnectionStatusBadge status={status} label={label} />
          </dd>
          <dd className="mt-2 text-xs text-slate-500">
            {isOnline ? 'Datele pot fi sincronizate cu serverul.' : 'Mod offline — datele locale sunt păstrate pe dispozitiv.'}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Server API</dt>
          <dd className="mt-2 text-base font-semibold text-slate-900">
            {data?.ok ? 'Disponibil' : 'Indisponibil'}
          </dd>
          <dd className="mt-1 text-xs text-slate-500">
            Uptime: {formatUptime(data?.uptime)}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Ultima verificare</dt>
          <dd className="mt-2 text-sm text-slate-700">{formatCheckedAt(new Date(dataUpdatedAt).toISOString())}</dd>
        </div>
      </dl>
    </section>
  );
}
