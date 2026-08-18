import { ANAMNESIS_FIELD_LABELS } from '../types/anamnesis-form';

interface ClinicalSummaryEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRegenerate: () => void;
}

export function ClinicalSummaryEditor({ value, onChange, onRegenerate }: ClinicalSummaryEditorProps) {
  return (
    <section className="rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{ANAMNESIS_FIELD_LABELS.clinical_summary}</h2>
          <p className="mt-1 text-xs text-slate-600">Maximum 8 puncte. Editabil înainte de salvare.</p>
        </div>
        <button
          type="button"
          onClick={onRegenerate}
          className="rounded-lg border border-brand-primary/30 px-3 py-1.5 text-xs font-semibold text-brand-primary"
        >
          Regenerează din formular
        </button>
      </div>
      <textarea
        id="anamnesis-field-clinical_summary"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={8}
        placeholder="Rezumatul clinic va fi generat la finalul interviului..."
        className="mt-4 min-h-[160px] w-full rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm leading-relaxed outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
    </section>
  );
}
