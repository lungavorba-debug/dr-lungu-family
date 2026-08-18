import type { AnamnesisTopic } from '../lib/clinical-intelligence';

interface AnamnesisCoverageChecklistProps {
  missingTopics: AnamnesisTopic[];
}

export function AnamnesisCoverageChecklist({ missingTopics }: AnamnesisCoverageChecklistProps) {
  if (missingTopics.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Informații lipsă din screening"
      className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-amber-900">Informații lipsă</h2>
      <p className="mt-1 text-xs text-amber-800">
        Verificați dacă doriți să adresați aceste subiecte înainte de a continua la măsurători.
      </p>
      <ul className="mt-3 space-y-2">
        {missingTopics.map((topic) => (
          <li key={topic.id} className="flex items-center gap-2 text-sm text-amber-900">
            <span
              className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-400 text-xs"
              aria-hidden="true"
            >
              □
            </span>
            {topic.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
