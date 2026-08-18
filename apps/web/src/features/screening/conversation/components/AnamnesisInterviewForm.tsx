import type { AiFieldHints } from '../types/providers';

import {
  ANAMNESIS_FIELD_ELEMENT_ID,
  type AnamnesisFormField,
  type AnamnesisFormState,
} from '../types/anamnesis-form';

import type { SmokingStatus } from '../types/conversation-form';

import {
  CHEST_PAIN_OPTIONS,
  SCREENING_QUESTION_LABELS,
  type ChestPainAnswer,
} from '../lib/screening-questions';

import { fieldHintBadge, fieldHintClass } from '../lib/field-hint-styles';

interface AnamnesisInterviewFormProps {
  form: AnamnesisFormState;
  onChange: (field: AnamnesisFormField, value: AnamnesisFormState[AnamnesisFormField]) => void;
  fieldHints?: AiFieldHints;
}

export function AnamnesisInterviewForm({ form, onChange, fieldHints }: AnamnesisInterviewFormProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Factori de risc cardiovascular</h2>
      <p className="text-sm text-slate-600">
        Citiți întrebările participantului — răspunsuri scurte, fără interviu medical complet.
      </p>

      <BooleanChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.known_hypertension}
        label={SCREENING_QUESTION_LABELS.known_hypertension}
        hint={fieldHints?.known_hypertension}
        value={form.known_hypertension}
        onChange={(value) => onChange('known_hypertension', value)}
      />

      <BooleanChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.known_diabetes}
        label={SCREENING_QUESTION_LABELS.known_diabetes}
        hint={fieldHints?.known_diabetes}
        value={form.known_diabetes}
        onChange={(value) => {
          onChange('known_diabetes', value);
          if (value !== true) {
            onChange('diabetes_type', null);
          }
        }}
      />

      {form.known_diabetes === true ? (
        <ChipGroup
          fieldId={ANAMNESIS_FIELD_ELEMENT_ID.diabetes_type}
          label={SCREENING_QUESTION_LABELS.diabetes_type}
          value={form.diabetes_type ?? ''}
          hint={fieldHints?.diabetes_type}
          options={[
            { value: 'type1', label: 'Tip 1' },
            { value: 'type2', label: 'Tip 2' },
            { value: 'gestational', label: 'Gestațional' },
          ]}
          onChange={(value) => onChange('diabetes_type', value as AnamnesisFormState['diabetes_type'])}
        />
      ) : null}

      <ChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.smoking_status}
        label={SCREENING_QUESTION_LABELS.smoking_status}
        value={form.smoking_status}
        hint={fieldHints?.smoking_status}
        options={[
          { value: 'current', label: 'Da' },
          { value: 'never', label: 'Nu' },
          { value: 'former', label: 'Fost fumător' },
        ]}
        onChange={(value) => onChange('smoking_status', value as SmokingStatus)}
      />

      <BooleanChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.follows_treatment}
        label={SCREENING_QUESTION_LABELS.follows_treatment}
        hint={fieldHints?.follows_treatment}
        value={form.follows_treatment}
        onChange={(value) => onChange('follows_treatment', value)}
      />

      {form.follows_treatment === true ? (
        <TextAreaField
          id={ANAMNESIS_FIELD_ELEMENT_ID.current_treatment}
          label={SCREENING_QUESTION_LABELS.current_treatment}
          value={form.current_treatment}
          hint={fieldHints?.current_treatment}
          onChange={(value) => onChange('current_treatment', value)}
          rows={2}
          placeholder="Notați exact ce spune participantul, dacă dorește."
        />
      ) : null}

      <ChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.chest_pain}
        label={SCREENING_QUESTION_LABELS.chest_pain}
        value={form.chest_pain ?? ''}
        hint={fieldHints?.chest_pain}
        options={CHEST_PAIN_OPTIONS.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        onChange={(value) => onChange('chest_pain', value as ChestPainAnswer)}
      />

      <BooleanChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.dyspnea}
        label={SCREENING_QUESTION_LABELS.dyspnea}
        hint={fieldHints?.dyspnea}
        value={form.dyspnea}
        onChange={(value) => onChange('dyspnea', value)}
      />

      <BooleanChipGroup
        fieldId={ANAMNESIS_FIELD_ELEMENT_ID.snoring}
        label={SCREENING_QUESTION_LABELS.snoring}
        hint={fieldHints?.snoring}
        value={form.snoring}
        onChange={(value) => onChange('snoring', value)}
      />
    </section>
  );
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  hint,
  rows = 2,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: AiFieldHints[keyof AiFieldHints];
  rows?: number;
  placeholder?: string;
}) {
  const badge = fieldHintBadge(hint);
  return (
    <label htmlFor={id} className={`block rounded-xl p-1 ${fieldHintClass(hint)}`}>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {badge ? (
          <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-accent">
            {badge}
          </span>
        ) : null}
      </span>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        title={hint?.sourceSentence ?? undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-[72px] w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
      />
    </label>
  );
}

function ChipGroup({
  fieldId,
  label,
  value,
  options,
  onChange,
  hint,
}: {
  fieldId: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  hint?: AiFieldHints[keyof AiFieldHints];
}) {
  const badge = fieldHintBadge(hint);
  return (
    <fieldset id={fieldId} className={`rounded-xl p-1 ${fieldHintClass(hint)}`}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {badge ? (
          <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-accent">
            {badge}
          </span>
        ) : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition ${
              value === option.value
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-primary/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function BooleanChipGroup({
  fieldId,
  label,
  value,
  onChange,
  hint,
}: {
  fieldId: string;
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  hint?: AiFieldHints[keyof AiFieldHints];
}) {
  const badge = fieldHintBadge(hint);
  return (
    <fieldset id={fieldId} className={`rounded-xl p-1 ${fieldHintClass(hint)}`}>
      <legend className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {badge ? (
          <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-xs font-semibold text-brand-accent">
            {badge}
          </span>
        ) : null}
      </legend>
      <div className="flex flex-wrap gap-2">
        {[
          { value: true, label: 'Da' },
          { value: false, label: 'Nu' },
        ].map((option) => (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition ${
              value === option.value
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-brand-primary/40'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
