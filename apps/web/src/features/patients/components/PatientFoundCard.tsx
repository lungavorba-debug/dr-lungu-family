import { formatPhoneDisplay } from '@medscreen/shared';
import type { PatientGender, PatientWithHistory } from '@medscreen/types';

const GENDER_LABELS: Record<PatientGender, string> = {
  M: 'Masculin',
  F: 'Feminin',
};

function formatLastScreeningDate(isoDate: string | null): string {
  if (!isoDate) {
    return 'Nicio evaluare anterioară';
  }

  const date = new Date(isoDate);
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

interface PatientFoundCardProps {
  patient: PatientWithHistory;
  onStartScreening: () => void;
  onSearchAnother: () => void;
}

export function PatientFoundCard({ patient, onStartScreening, onSearchAnother }: PatientFoundCardProps) {
  const fullName = `${patient.last_name} ${patient.first_name}`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/5 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-accent text-white">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-brand-accent">Pacient găsit în istoric</p>
            <p className="mt-1 text-xs text-slate-600">
              Ultima evaluare: {formatLastScreeningDate(patient.last_screening_date)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefon</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{formatPhoneDisplay(patient.phone)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Vârstă</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{patient.age} ani</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Sex</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{GENDER_LABELS[patient.gender]}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Localitate</dt>
            <dd className="mt-1 text-base font-semibold text-slate-900">{patient.city}</dd>
          </div>
        </dl>
      </div>

      <button
        type="button"
        onClick={onStartScreening}
        className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-brand-primary text-base font-semibold text-white transition hover:bg-brand-secondary"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Screening nou pentru acest pacient
      </button>

      <button
        type="button"
        onClick={onSearchAnother}
        className="flex min-h-touch w-full items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Caută alt număr de telefon
      </button>
    </div>
  );
}
