import type { AnamnesisFieldContradiction } from '../lib/clinical-intelligence';

interface AnamnesisContradictionPanelProps {
  contradictions: AnamnesisFieldContradiction[];
  onAccept: (field: AnamnesisFieldContradiction['field']) => void;
  onReject: (field: AnamnesisFieldContradiction['field']) => void;
}

export function AnamnesisContradictionPanel({
  contradictions,
  onAccept,
  onReject,
}: AnamnesisContradictionPanelProps) {
  if (contradictions.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Contradicții detectate"
      className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm"
    >
      <h2 className="text-sm font-semibold text-red-900">Posibile contradicții detectate</h2>
      <p className="mt-1 text-xs text-red-800">
        Participantul pare să fi schimbat un răspuns. Confirmați valoarea corectă — nu se aplică automat.
      </p>
      <ul className="mt-3 space-y-3">
        {contradictions.map((item) => (
          <li key={item.field} className="rounded-xl border border-red-100 bg-white px-3 py-3">
            <p className="text-sm font-medium text-slate-900">{item.label}</p>
            <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Valoare curentă</p>
                <p className="text-slate-800">{item.currentValue || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Propunere nouă</p>
                <p className="text-slate-800">{item.proposedValue || '—'}</p>
              </div>
            </div>
            {item.sourceSentence ? (
              <p className="mt-2 text-xs italic text-slate-600">„{item.sourceSentence}”</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAccept(item.field)}
                className="rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-semibold text-white"
              >
                Acceptă noua valoare
              </button>
              <button
                type="button"
                onClick={() => onReject(item.field)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
              >
                Păstrează valoarea curentă
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
