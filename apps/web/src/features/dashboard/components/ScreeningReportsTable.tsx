import { Link } from 'react-router-dom';
import { formatPhoneDisplay } from '@medscreen/shared';
import type { ScreeningReportListItem } from '@medscreen/types';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';

interface ScreeningReportsTableProps {
  reports: ScreeningReportListItem[];
  onDownloadPdf: (screeningId: string) => void;
  downloadingScreeningId?: string | null;
  showPatientLink?: boolean;
}

export function ScreeningReportsTable({
  reports,
  onDownloadPdf,
  downloadingScreeningId,
  showPatientLink = true,
}: ScreeningReportsTableProps) {
  if (reports.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu există rapoarte finalizate pentru criteriile selectate.
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
              <th className="px-4 py-3 font-medium">PDF</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports.map((report) => {
              const isDownloading = downloadingScreeningId === report.screening_id;
              return (
                <tr key={report.screening_id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {report.patient_name ?? '—'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {report.patient_phone ? formatPhoneDisplay(report.patient_phone) : '—'}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDashboardDateTime(report.completed_at)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{report.operator_name}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {report.has_pdf ? report.pdf_filename ?? 'Disponibil' : 'Indisponibil'}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {showPatientLink && report.patient_id ? (
                        <Link
                          to={`/patients/${report.patient_id}`}
                          className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary"
                        >
                          Pacient
                        </Link>
                      ) : null}
                      {report.has_pdf ? (
                        <button
                          type="button"
                          disabled={isDownloading}
                          onClick={() => onDownloadPdf(report.screening_id)}
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
