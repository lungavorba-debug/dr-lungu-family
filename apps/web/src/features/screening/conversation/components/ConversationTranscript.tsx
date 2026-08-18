import type { TranscriptSegment } from '../types/providers';

interface ConversationTranscriptProps {
  segments: TranscriptSegment[];
}

export function ConversationTranscript({ segments }: ConversationTranscriptProps) {
  return (
    <section
      aria-label="Transcriere conversație"
      className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner"
    >
      <h2 className="text-sm font-semibold text-slate-700">Transcriere conversație</h2>
      <div className="mt-3 max-h-44 space-y-2 overflow-y-auto pr-1">
        {segments.length === 0 ? (
          <p className="text-sm text-slate-500">Transcrierea va apărea aici pe măsură ce conversația avansează.</p>
        ) : (
          segments.map((segment) => (
            <p
              key={segment.id}
              className={`rounded-xl px-3 py-2 text-sm ${
                segment.source === 'system'
                  ? 'bg-white text-slate-500'
                  : segment.source === 'operator'
                    ? 'bg-brand-primary/10 text-brand-primary'
                    : 'bg-white text-slate-800'
              }`}
            >
              {segment.text}
            </p>
          ))
        )}
      </div>
    </section>
  );
}
