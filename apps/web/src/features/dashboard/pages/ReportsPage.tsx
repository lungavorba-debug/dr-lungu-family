import { useState, type FormEvent } from 'react';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { DashboardCampaignGate } from '../components/DashboardCampaignGate';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { ScreeningReportsTable } from '../components/ScreeningReportsTable';
import { useDownloadScreeningPdf } from '../hooks/useDownloadScreeningPdf';
import { useScreeningReports } from '../hooks/useScreeningReports';

export function ReportsPage() {
  const { activeCampaign } = useCampaign();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching, isError, error, refetch } = useScreeningReports({
    campaignId: activeCampaign?.id,
    search: appliedSearch,
    page,
    limit,
  });

  const downloadPdf = useDownloadScreeningPdf();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim() || undefined);
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <DashboardCampaignGate>
      <div className="space-y-6">
        <DashboardPageHeader
          title="Rapoarte"
          description="Arhiva rapoartelor PDF finalizate pentru campania activă."
        />

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="report-search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Căutare participant
            </label>
            <input
              id="report-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nume sau telefon"
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60"
          >
            {isFetching ? 'Se caută...' : 'Caută'}
          </button>
        </form>

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error instanceof Error ? error.message : 'Lista rapoartelor nu a putut fi încărcată.'}</p>
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
            Se încarcă rapoartele...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                {data?.total ?? 0} raport{(data?.total ?? 0) === 1 ? '' : 'e'} finalizat
                {(data?.total ?? 0) === 1 ? '' : 'e'}
              </span>
              {appliedSearch ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setAppliedSearch(undefined);
                    setPage(1);
                  }}
                  className="font-medium text-brand-primary hover:underline"
                >
                  Șterge filtrul
                </button>
              ) : null}
            </div>

            <ScreeningReportsTable
              reports={data?.reports ?? []}
              downloadingScreeningId={downloadPdf.isPending ? downloadPdf.variables : null}
              onDownloadPdf={(screeningId) => downloadPdf.mutate(screeningId)}
            />

            {downloadPdf.isError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {downloadPdf.error instanceof Error
                  ? downloadPdf.error.message
                  : 'PDF-ul nu a putut fi descărcat.'}
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-500">
                  Pagina {page} din {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((current) => current + 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  Următor
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </DashboardCampaignGate>
  );
}
