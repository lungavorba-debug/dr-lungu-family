interface ConversationProgressProps {
  percent: number;
  missingRequired: string[];
  missingLabels: Record<string, string>;
  title?: string;
}

export function ConversationProgress({
  percent,
  missingRequired,
  missingLabels,
  title = 'Progres formular',
}: ConversationProgressProps) {
  const filledBlocks = Math.round(percent / 10);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <span className="text-sm font-bold text-brand-primary">{percent}%</span>
      </div>
      <div className="mt-3 font-mono text-lg tracking-widest text-brand-primary" aria-hidden>
        {'█'.repeat(filledBlocks)}
        {'░'.repeat(10 - filledBlocks)} {percent}%
      </div>
      {missingRequired.length > 0 ? (
        <p className="mt-3 text-sm text-slate-600">
          Câmpuri obligatorii lipsă:{' '}
          {missingRequired.map((field) => missingLabels[field] ?? field).join(', ')}
        </p>
      ) : (
        <p className="mt-3 text-sm font-medium text-brand-accent">
          Toate câmpurile obligatorii sunt completate.
        </p>
      )}
    </section>
  );
}
