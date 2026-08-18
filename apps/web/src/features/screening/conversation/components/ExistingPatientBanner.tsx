import type { PatientWithHistory } from '@medscreen/types';

interface ExistingPatientBannerProps {
  patient: PatientWithHistory;
  isSearching: boolean;
  onContinueWithExisting: () => void;
}

function formatLastScreeningDate(isoDate: string | null): string {
  if (!isoDate) return 'Nicio evaluare anterioară';
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

export function ExistingPatientBanner({
  patient,
  isSearching,
  onContinueWithExisting,
}: ExistingPatientBannerProps) {
  return (
    <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">
            Participant existent identificat
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900">
            {patient.last_name} {patient.first_name}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Ultima evaluare: {formatLastScreeningDate(patient.last_screening_date)}
          </p>
        </div>
        <button
          type="button"
          onClick={onContinueWithExisting}
          disabled={isSearching}
          className="min-h-[56px] rounded-xl bg-brand-accent px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          Continuă cu participant existent
        </button>
      </div>
    </div>
  );
}
