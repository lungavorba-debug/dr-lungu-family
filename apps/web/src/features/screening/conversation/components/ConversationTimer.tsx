interface ConversationTimerProps {
  elapsedSeconds: number;
  active: boolean;
  compact?: boolean;
}

export function ConversationTimer({ elapsedSeconds, active, compact = false }: ConversationTimerProps) {
  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (elapsedSeconds % 60).toString().padStart(2, '0');

  if (compact) {
    return (
      <p className={`text-sm font-bold tabular-nums ${active ? 'text-brand-primary' : 'text-slate-400'}`}>
        {minutes}:{seconds}
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {active ? 'Durată înregistrare' : 'Cronometru'}
      </p>
      <p className={`mt-1 text-3xl font-bold tabular-nums ${active ? 'text-brand-primary' : 'text-slate-400'}`}>
        {minutes}:{seconds}
      </p>
    </div>
  );
}
