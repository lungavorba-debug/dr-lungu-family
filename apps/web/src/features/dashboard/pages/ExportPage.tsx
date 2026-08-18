import { useMemo, useState } from 'react';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { DashboardCampaignGate } from '../components/DashboardCampaignGate';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { useExportScreeningsExcel, useExportScreeningsMetadata } from '../hooks/useExportScreenings';

function countCampaignDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.max(1, Math.floor(diffMs / 86_400_000) + 1);
}

function toIsoStartOfDay(dateValue: string): string {
  return new Date(`${dateValue}T00:00:00`).toISOString();
}

function toIsoEndOfDay(dateValue: string): string {
  return new Date(`${dateValue}T23:59:59.999`).toISOString();
}

export function ExportPage() {
  const { activeCampaign } = useCampaign();
  const { data: metadata, isLoading, isError, error, refetch } = useExportScreeningsMetadata(
    activeCampaign?.id,
  );
  const exportExcel = useExportScreeningsExcel();

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [campaignDay, setCampaignDay] = useState('');

  const campaignDays = useMemo(() => {
    if (!activeCampaign) return [];
    return Array.from(
      { length: countCampaignDays(activeCampaign.start_date, activeCampaign.end_date) },
      (_, index) => index + 1,
    );
  }, [activeCampaign]);

  const exportableCount = metadata?.exportable_count ?? 0;

  function handleExport() {
    if (!activeCampaign) return;

    exportExcel.mutate({
      campaignId: activeCampaign.id,
      from: fromDate ? toIsoStartOfDay(fromDate) : undefined,
      to: toDate ? toIsoEndOfDay(toDate) : undefined,
      campaignDay: campaignDay ? Number(campaignDay) : undefined,
    });
  }

  return (
    <DashboardCampaignGate>
      <div className="space-y-6">
        <DashboardPageHeader
          title="Export Excel"
          description="Exportați screeningurile finalizate ale campaniei active într-un fișier Excel formatat."
        />

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Se încarcă datele de export...
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p>{error instanceof Error ? error.message : 'Metadatele exportului nu au putut fi încărcate.'}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-2 font-semibold text-red-800 underline"
            >
              Reîncearcă
            </button>
          </div>
        ) : null}

        {!isLoading && !isError ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Screeninguri finalizate</h2>
            <p className="mt-2 text-sm text-slate-600">
              Campanie: <span className="font-medium text-slate-900">{activeCampaign?.name}</span>
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {exportableCount} înregistrări disponibile pentru export
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="export-from" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  De la
                </label>
                <input
                  id="export-from"
                  type="date"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="export-to" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Până la
                </label>
                <input
                  id="export-to"
                  type="date"
                  value={toDate}
                  onChange={(event) => setToDate(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                />
              </div>
              <div>
                <label htmlFor="export-day" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Ziua campaniei
                </label>
                <select
                  id="export-day"
                  value={campaignDay}
                  onChange={(event) => setCampaignDay(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
                >
                  <option value="">Toate zilele</option>
                  {campaignDays.map((day) => (
                    <option key={day} value={day}>
                      Ziua {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={handleExport}
                disabled={exportableCount === 0 || exportExcel.isPending}
                className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {exportExcel.isPending ? 'Se generează exportul...' : 'Exportă Excel'}
              </button>
            </div>

            {exportExcel.isError ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {exportExcel.error instanceof Error
                  ? exportExcel.error.message
                  : 'Exportul nu a putut fi generat.'}
              </div>
            ) : null}

            {exportExcel.isSuccess ? (
              <div className="mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
                {exportExcel.data.rowCount ?? exportableCount} screeninguri exportate în Excel.
              </div>
            ) : null}

            {exportableCount === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Nu există screeninguri finalizate de exportat pentru campania activă.
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </DashboardCampaignGate>
  );
}
