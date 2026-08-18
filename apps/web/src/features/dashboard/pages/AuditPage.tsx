import { useState, type FormEvent } from 'react';
import type { AuditAction, AuditEntityType, AuditLogListItem } from '@medscreen/types';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { AuditLogDetailsDialog } from '../components/AuditLogDetailsDialog';
import { AuditLogsTable } from '../components/AuditLogsTable';
import { useAuditLogs } from '../hooks/useAuditLogs';
import { AUDIT_ACTION_OPTIONS, AUDIT_ENTITY_TYPE_OPTIONS } from '../lib/audit-labels';

function toIsoStart(date: string): string {
  return new Date(`${date}T00:00:00`).toISOString();
}

function toIsoEnd(date: string): string {
  return new Date(`${date}T23:59:59.999`).toISOString();
}

export function AuditPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<AuditEntityType | 'all'>('all');
  const [entityId, setEntityId] = useState('');
  const [appliedEntityId, setAppliedEntityId] = useState<string | undefined>(undefined);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [appliedFrom, setAppliedFrom] = useState<string | undefined>(undefined);
  const [appliedTo, setAppliedTo] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogListItem | null>(null);
  const limit = 20;

  const { data, isLoading, isFetching, isError, error, refetch } = useAuditLogs({
    search: appliedSearch,
    action: actionFilter === 'all' ? undefined : actionFilter,
    entityType: entityTypeFilter === 'all' ? undefined : entityTypeFilter,
    entityId: appliedEntityId,
    from: appliedFrom,
    to: appliedTo,
    page,
    limit,
  });

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim() || undefined);
    setAppliedEntityId(entityId.trim() || undefined);
    setAppliedFrom(fromDate ? toIsoStart(fromDate) : undefined);
    setAppliedTo(toDate ? toIsoEnd(toDate) : undefined);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters =
    appliedSearch ||
    actionFilter !== 'all' ||
    entityTypeFilter !== 'all' ||
    appliedEntityId ||
    appliedFrom ||
    appliedTo;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Jurnal Audit"
        description="Evenimente de securitate și operațiuni importante înregistrate în platformă."
      />

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-2 xl:grid-cols-3"
      >
        <div>
          <label htmlFor="audit-search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Căutare utilizator
          </label>
          <input
            id="audit-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nume utilizator"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="audit-action" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Acțiune
          </label>
          <select
            id="audit-action"
            value={actionFilter}
            onChange={(event) => {
              setActionFilter(event.target.value as AuditAction | 'all');
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate acțiunile</option>
            {AUDIT_ACTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audit-entity-type" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Tip entitate
          </label>
          <select
            id="audit-entity-type"
            value={entityTypeFilter}
            onChange={(event) => {
              setEntityTypeFilter(event.target.value as AuditEntityType | 'all');
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate entitățile</option>
            {AUDIT_ENTITY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="audit-entity-id" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            ID entitate
          </label>
          <input
            id="audit-entity-id"
            type="text"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
            placeholder="UUID entitate"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="audit-from" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            De la data
          </label>
          <input
            id="audit-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="audit-to" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Până la data
          </label>
          <input
            id="audit-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div className="flex items-end lg:col-span-2 xl:col-span-3">
          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60 sm:w-auto"
          >
            {isFetching ? 'Se aplică...' : 'Aplică filtrele'}
          </button>
        </div>
      </form>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error instanceof Error ? error.message : 'Jurnalul de audit nu a putut fi încărcat.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-semibold text-red-800 underline"
          >
            Reîncearcă
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Se încarcă jurnalul de audit...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>{data?.total ?? 0} eveniment{(data?.total ?? 0) === 1 ? '' : 'e'}</span>
            {hasFilters ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch(undefined);
                  setActionFilter('all');
                  setEntityTypeFilter('all');
                  setEntityId('');
                  setAppliedEntityId(undefined);
                  setFromDate('');
                  setToDate('');
                  setAppliedFrom(undefined);
                  setAppliedTo(undefined);
                  setPage(1);
                }}
                className="font-medium text-brand-primary hover:underline"
              >
                Resetează filtrele
              </button>
            ) : null}
          </div>

          <AuditLogsTable
            entries={data?.entries ?? []}
            onSelect={(entry) => setSelectedEntry(entry)}
          />

          {totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50"
              >
                Înapoi
              </button>
              <span className="text-slate-500">
                Pagina {page} din {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50"
              >
                Înainte
              </button>
            </div>
          ) : null}
        </>
      )}

      {selectedEntry ? (
        <AuditLogDetailsDialog entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      ) : null}
    </div>
  );
}
