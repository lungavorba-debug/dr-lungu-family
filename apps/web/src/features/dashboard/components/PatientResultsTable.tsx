import { Link } from 'react-router-dom';
import { formatPhoneDisplay } from '@medscreen/shared';
import type { PatientGender, PatientWithHistory } from '@medscreen/types';
import { formatDashboardDateTime } from '../lib/format-dashboard-date';

const GENDER_LABELS: Record<PatientGender, string> = {
  M: 'Masculin',
  F: 'Feminin',
};

interface PatientResultsTableProps {
  patients: PatientWithHistory[];
  onStartScreening?: (patient: PatientWithHistory) => void;
  showDetailLink?: boolean;
}

export function PatientResultsTable({
  patients,
  onStartScreening,
  showDetailLink = true,
}: PatientResultsTableProps) {
  if (patients.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu au fost găsiți pacienți pentru criteriile selectate.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Pacient</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Vârstă</th>
              <th className="px-4 py-3 font-medium">Ultima evaluare</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => {
              const fullName = `${patient.last_name} ${patient.first_name}`;
              return (
                <tr key={patient.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4">
                    <p className="font-semibold text-slate-900">{fullName}</p>
                    <p className="text-xs text-slate-500">
                      {GENDER_LABELS[patient.gender]} · {patient.city}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatPhoneDisplay(patient.phone)}</td>
                  <td className="px-4 py-4 text-slate-700">{patient.age} ani</td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDashboardDateTime(patient.last_screening_date)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {showDetailLink ? (
                        <Link
                          to={`/patients/${patient.id}`}
                          className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary"
                        >
                          Detalii
                        </Link>
                      ) : null}
                      {onStartScreening ? (
                        <button
                          type="button"
                          onClick={() => onStartScreening(patient)}
                          className="inline-flex min-h-[36px] items-center rounded-lg bg-brand-primary px-3 text-xs font-semibold text-white transition hover:bg-brand-secondary"
                        >
                          Screening nou
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
