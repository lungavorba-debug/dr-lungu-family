import type { Patient } from '@medscreen/types';

interface ParticipantPreview {
  first_name: string;
  last_name: string;
  age?: number;
  phone?: string;
}

interface ScreeningParticipantBannerProps {
  patient: Patient | null;
  preview?: ParticipantPreview | null;
  stepLabel?: string;
}

export function ScreeningParticipantBanner({
  patient,
  preview,
  stepLabel,
}: ScreeningParticipantBannerProps) {
  const display = patient ?? preview;
  if (!display) {
    return null;
  }

  const ageText = display.age ? ` · ${display.age} ani` : '';
  const phoneText = display.phone ? ` · ${display.phone}` : '';

  return (
    <div
      className="rounded-xl border border-brand-primary/20 bg-white/95 px-4 py-3 shadow-sm backdrop-blur-sm"
      data-testid="screening-participant-banner"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">Participant activ</p>
      <p className="text-base font-semibold text-slate-900">
        {display.last_name} {display.first_name}
        <span className="ml-2 text-sm font-normal text-slate-500">
          {ageText}
          {phoneText}
        </span>
      </p>
      {stepLabel ? <p className="mt-1 text-xs text-slate-500">{stepLabel}</p> : null}
    </div>
  );
}
