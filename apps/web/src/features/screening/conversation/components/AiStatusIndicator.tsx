import type { AiConversationStatus } from '../types/providers';

const STATUS_LABELS: Record<AiConversationStatus, string> = {
  idle: 'Inactiv',
  recording: 'Înregistrare',
  paused: 'Pauză',
  transcribing: 'Transcriere',
  extracting: 'Extragere AI',
  ready: 'Gata',
  completed: 'Finalizat',
};

const STATUS_STYLES: Record<AiConversationStatus, string> = {
  idle: 'bg-slate-100 text-slate-700',
  recording: 'bg-brand-primary/10 text-brand-primary',
  paused: 'bg-amber-50 text-amber-700',
  transcribing: 'bg-sky-50 text-sky-700',
  extracting: 'bg-violet-50 text-violet-700',
  ready: 'bg-brand-accent/10 text-brand-accent',
  completed: 'bg-emerald-50 text-emerald-700',
};

interface AiStatusIndicatorProps {
  status: AiConversationStatus;
}

export function AiStatusIndicator({ status }: AiStatusIndicatorProps) {
  const dotClass =
    status === 'recording'
      ? 'bg-brand-primary animate-pulse'
      : status === 'paused'
        ? 'bg-amber-500'
        : status === 'transcribing' || status === 'extracting'
          ? 'bg-violet-500 animate-pulse'
          : status === 'ready'
            ? 'bg-brand-accent'
            : 'bg-slate-400';

  return (
    <div
      className={`inline-flex min-h-touch items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${STATUS_STYLES[status]}`}
      role="status"
      aria-live="polite"
    >
      <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} aria-hidden />
      {STATUS_LABELS[status]}
    </div>
  );
}
