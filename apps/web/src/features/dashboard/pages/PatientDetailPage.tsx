import { Link, Navigate, useParams } from 'react-router-dom';
import { formatPhoneDisplay } from '@medscreen/shared';
import type { PatientGender } from '@medscreen/types';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { DashboardCampaignGate } from '../components/DashboardCampaignGate';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { ScreeningReportsTable } from '../components/ScreeningReportsTable';
import { useDownloadScreeningPdf } from '../hooks/useDownloadScreeningPdf';
import { useScreeningReports } from '../hooks/useScreeningReports';
import { useStartScreeningWithPatient } from '../hooks/useStartScreeningWithPatient';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';
import { usePatient, usePreviousMeasurements } from '../../patients/hooks/usePatientQueries';

const GENDER_LABELS: Record<PatientGender, string> = {
  M: 'Masculin',
  F: 'Feminin',
};

function formatMeasurementValue(value: number | boolean | string | null | undefined, suffix = ''): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Da' : 'Nu';
  return `${value}${suffix}`;
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { activeCampaign } = useCampaign();
  const { data: patient, isLoading, isError, error } = usePatient(patientId);
  const { data: history, isLoading: historyLoading } = usePreviousMeasurements(patientId);
  const { data: reportsData, isLoading: reportsLoading } = useScreeningReports({
    campaignId: activeCampaign?.id,
    patientId,
    limit: 10,
  });
  const downloadPdf = useDownloadScreeningPdf();
  const startScreeningWithPatient = useStartScreeningWithPatient();

  if (!patientId) {
    return <Navigate to="/patients" replace />;
  }

  return (
    <DashboardCampaignGate>
      <div className="space-y-6">
        <DashboardPageHeader
          title="Detalii pacient"
          description="Profil participant și măsurători anterioare din baza de date."
        />

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Se încarcă pacientul...
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Pacientul nu a putut fi încărcat.'}
          </div>
        ) : null}

        {patient ? (
          <>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {patient.last_name} {patient.first_name}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Înregistrat la {formatDashboardDateTime(patient.created_at)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to="/patients"
                    className="inline-flex min-h-touch items-center rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Înapoi la listă
                  </Link>
                  <button
                    type="button"
                    onClick={() => startScreeningWithPatient(patient)}
                    className="inline-flex min-h-touch items-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary"
                  >
                    Screening nou
                  </button>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefon</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{formatPhoneDisplay(patient.phone)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Vârstă</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{patient.age} ani</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Sex</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{GENDER_LABELS[patient.gender]}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Localitate</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{patient.city}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Măsurători anterioare</h3>
              {historyLoading ? (
                <p className="mt-4 text-sm text-slate-500">Se încarcă istoricul...</p>
              ) : history?.previous ? (
                <>
                  <p className="mt-2 text-sm text-slate-500">
                    Data ultimei evaluări: {formatDashboardDateTime(history.previous_date)}
                  </p>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-xs text-slate-500">TA sistolică</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.systolic_bp, ' mmHg')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">TA diastolică</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.diastolic_bp, ' mmHg')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Puls</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.pulse, ' bpm')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">SpO₂</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.oxygen_saturation, '%')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Glicemie</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.blood_glucose, ' mg/dL')}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">IMC</dt>
                      <dd className="font-medium text-slate-900">
                        {formatMeasurementValue(history.previous.bmi)}
                      </dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-500">Nu există măsurători anterioare înregistrate.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">Rapoarte screening</h3>
              <p className="mt-1 text-sm text-slate-500">
                Rapoarte PDF finalizate pentru campania activă.
              </p>
              {reportsLoading ? (
                <p className="mt-4 text-sm text-slate-500">Se încarcă rapoartele...</p>
              ) : (
                <div className="mt-4">
                  <ScreeningReportsTable
                    reports={reportsData?.reports ?? []}
                    showPatientLink={false}
                    downloadingScreeningId={downloadPdf.isPending ? downloadPdf.variables : null}
                    onDownloadPdf={(screeningId) => downloadPdf.mutate(screeningId)}
                  />
                </div>
              )}
              {downloadPdf.isError ? (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {downloadPdf.error instanceof Error
                    ? downloadPdf.error.message
                    : 'PDF-ul nu a putut fi descărcat.'}
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </DashboardCampaignGate>
  );
}
