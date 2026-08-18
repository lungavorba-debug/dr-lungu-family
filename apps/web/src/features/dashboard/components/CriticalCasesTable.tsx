import { Link } from 'react-router-dom';
import { formatPhoneDisplay } from '@medscreen/shared';
import type { CriticalCaseListItem } from '@medscreen/types';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';

interface CriticalCasesTableProps {
  cases: CriticalCaseListItem[];
  onDownloadPdf: (screeningId: string) => void;
  downloadingScreeningId?: string | null;
}

export function CriticalCasesTable({
  cases,
  onDownloadPdf,
  downloadingScreeningId,
}: CriticalCasesTableProps) {
  if (cases.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu există cazuri critice finalizate pentru campania activă.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Participant</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Finalizat</th>
              <th className="px-4 py-3 font-medium">Operator</th>
              <th className="px-4 py-3 font-medium">Avertismente critice</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((criticalCase) => {
              const isDownloading = downloadingScreeningId === criticalCase.screening_id;
              return (
                <tr key={criticalCase.screening_id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {criticalCase.patient_name ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {criticalCase.patient_phone
                      ? formatPhoneDisplay(criticalCase.patient_phone)
                      : '—'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDashboardDateTime(criticalCase.completed_at)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{criticalCase.operator_name}</td>
                  <td className="px-4 py-4">
                    <ul className="space-y-1">
                      {criticalCase.critical_warnings.map((warning) => (
                        <li
                          key={`${criticalCase.screening_id}-${warning.code}`}
                          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                        >
                          {warning.message}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {criticalCase.patient_id ? (
                        <Link
                          to={`/patients/${criticalCase.patient_id}`}
                          className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary"
                        >
                          Pacient
                        </Link>
                      ) : null}
                      {criticalCase.has_pdf ? (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => onDownloadPdf(criticalCase.screening_id)}
                          className="inline-flex min-h-[36px] items-center rounded-lg bg-brand-primary px-3 text-xs font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isDownloading ? 'Se descarcă...' : 'Descarcă PDF'}
                        </button>
                      ) : null}
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
