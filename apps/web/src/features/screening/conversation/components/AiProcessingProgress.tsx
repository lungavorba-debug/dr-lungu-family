interface AiProcessingProgressProps {
  isTranscribing: boolean;
  isExtracting: boolean;
}

export function AiProcessingProgress({ isTranscribing, isExtracting }: AiProcessingProgressProps) {
  if (!isTranscribing && !isExtracting) {
    return null;
  }

  const label = isTranscribing ? 'Se transcrie înregistrarea audio...' : 'Se extrag câmpurile din conversație...';

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3" role="status" aria-live="polite">
      <div className="mb-2 flex items-center justify-between text-sm font-medium text-sky-900">
        <span>{label}</span>
        <span className="text-xs text-sky-700">{isTranscribing ? 'Pas 1/2' : 'Pas 2/2'}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-sky-100">
        <div
          className={`h-full rounded-full bg-sky-500 transition-all ${isTranscribing ? 'w-1/2 animate-pulse' : 'w-full animate-pulse'}`}
        />
      </div>
    </div>
  );
}
