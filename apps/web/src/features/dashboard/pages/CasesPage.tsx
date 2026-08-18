import { useState } from 'react';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { CriticalCasesTable } from '../components/CriticalCasesTable';
import { DashboardCampaignGate } from '../components/DashboardCampaignGate';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { useCriticalCases } from '../hooks/useCriticalCases';
import { useDownloadScreeningPdf } from '../hooks/useDownloadScreeningPdf';

export function CasesPage() {
  const { activeCampaign } = useCampaign();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isFetching, isError, error, refetch } = useCriticalCases({
    campaignId: activeCampaign?.id,
    page,
    limit,
  });

  const downloadPdf = useDownloadScreeningPdf();
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <DashboardCampaignGate>
      <div className="space-y-6">
        <DashboardPageHeader
          title="Cazuri Critice"
          description="Screeninguri finalizate cu avertismente clinice critice, din evaluarea salvată la finalizare."
        />

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error instanceof Error ? error.message : 'Lista cazurilor critice nu a putut fi încărcată.'}</p>
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
            Se încarcă cazurile critice...
          </div>
        ) : (
          <>
            <div className="text-sm text-slate-500">
              {data?.total ?? 0} caz critic{(data?.total ?? 0) === 1 ? '' : 'e'} în campania activă
            </div>

            <CriticalCasesTable
              cases={data?.cases ?? []}
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
