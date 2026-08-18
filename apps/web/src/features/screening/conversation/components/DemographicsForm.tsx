import { useMemo, useRef, type RefObject } from 'react';
import { formatPhoneInput } from '@medscreen/shared';
import type { PatientGender } from '@medscreen/types';
import { sanitizeAgeValue, shouldAutoAdvanceAge } from '../lib/age-field-input';
import { fieldHintBadge, fieldHintClass } from '../lib/field-hint-styles';
import type { DemographicsFieldHints } from '../lib/apply-voice-extraction';
import type { ConversationFormField, ConversationFormState } from '../types/conversation-form';
import { CONVERSATION_FIELD_ELEMENT_ID } from '../types/conversation-form';
import {
  OTHER_LOCALITY_OPTION,
  SCREENING_LOCALITIES,
  isPresetLocality,
} from '../constants/localities';

interface DemographicsFormProps {
  form: ConversationFormState;
  fieldHints?: DemographicsFieldHints;
  onChange: (field: ConversationFormField, value: ConversationFormState[ConversationFormField]) => void;
}

export function DemographicsForm({ form, fieldHints, onChange }: DemographicsFormProps) {
  const genderFirstButtonRef = useRef<HTMLButtonElement>(null);

  const localityChipValue = useMemo(() => {
    if (isPresetLocality(form.city)) return form.city;
    return OTHER_LOCALITY_OPTION;
  }, [form.city]);

  const showCustomLocality =
    localityChipValue === OTHER_LOCALITY_OPTION &&
    (!form.city || !isPresetLocality(form.city) || form.city === OTHER_LOCALITY_OPTION);

  function handleLocalitySelect(value: string) {
    if (value === OTHER_LOCALITY_OPTION) {
      onChange('city', '');
      return;
    }
    onChange('city', value);
  }

  function handleAgeChange(rawValue: string) {
    const sanitized = sanitizeAgeValue(rawValue);
    onChange('age', sanitized);
    if (shouldAutoAdvanceAge(sanitized)) {
      requestAnimationFrame(() => genderFirstButtonRef.current?.focus({ preventScroll: false }));
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-slate-900">Date participant</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id={CONVERSATION_FIELD_ELEMENT_ID.first_name}
          label="Prenume"
          value={form.first_name}
          hint={fieldHints?.first_name}
          onChange={(value) => onChange('first_name', value)}
        />
        <TextField
          id={CONVERSATION_FIELD_ELEMENT_ID.last_name}
          label="Nume"
          value={form.last_name}
          hint={fieldHints?.last_name}
          onChange={(value) => onChange('last_name', value)}
        />
        <TextField
          id={CONVERSATION_FIELD_ELEMENT_ID.phone}
          label="Telefon"
          value={form.phone}
          inputMode="tel"
          hint={fieldHints?.phone}
          onChange={(value) => onChange('phone', formatPhoneInput(value))}
        />
        <TextField
          id={CONVERSATION_FIELD_ELEMENT_ID.age}
          label="Vârstă"
          value={form.age}
          inputMode="numeric"
          hint={fieldHints?.age}
          onChange={handleAgeChange}
        />
      </div>
      <ChipGroup
        fieldId={CONVERSATION_FIELD_ELEMENT_ID.gender}
        label="Sex"
        value={form.gender}
        hint={fieldHints?.gender}
        options={[
          { value: 'M', label: 'Masculin' },
          { value: 'F', label: 'Feminin' },
        ]}
        onChange={(value) => onChange('gender', value as PatientGender)}
        firstButtonRef={genderFirstButtonRef}
      />
      <ChipGroup
        fieldId={CONVERSATION_FIELD_ELEMENT_ID.city}
        label="Localitate"
        value={localityChipValue}
        hint={fieldHints?.city}
        options={SCREENING_LOCALITIES.map((city) => ({ value: city, label: city }))}
        onChange={handleLocalitySelect}
      />
      {showCustomLocality ? (
        <TextField
          id={CONVERSATION_FIELD_ELEMENT_ID.city}
          label="Specificați localitatea"
          value={form.city === OTHER_LOCALITY_OPTION ? '' : form.city}
          hint={fieldHints?.city}
          onChange={(value) => onChange('city', value)}
          placeholder="Introduceți localitatea"
        />
      ) : null}
    </section>
  );
}

function FieldHintBadge({ hint }: { hint?: DemographicsFieldHints[keyof DemographicsFieldHints] }) {
  const badge = fieldHintBadge(hint);
  if (!badge) return null;
  return (
    <span className="ml-2 inline-flex rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
      {badge}
    </span>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  inputMode,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: 'text' | 'tel' | 'numeric';
  placeholder?: string;
  hint?: DemographicsFieldHints[keyof DemographicsFieldHints];
}) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-2 flex items-center text-sm font-medium text-slate-700">
        {label}
        <FieldHintBadge hint={hint} />
      </span>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`h-14 w-full rounded-xl border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 ${fieldHintClass(hint)}`}
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
  firstButtonRef,
  hint,
}: {
  fieldId: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  firstButtonRef?: RefObject<HTMLButtonElement | null>;
  hint?: DemographicsFieldHints[keyof DemographicsFieldHints];
}) {
  return (
    <fieldset id={fieldId} className={fieldHintClass(hint)}>
      <legend className="mb-2 flex items-center text-sm font-medium text-slate-700">
        {label}
        <FieldHintBadge hint={hint} />
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option, index) => (
          <button
            key={option.value}
            ref={index === 0 ? firstButtonRef : undefined}
            type="button"
            onClick={() => onChange(option.value)}
            className={`min-h-touch rounded-xl border px-4 py-2 text-sm font-medium transition ${value === option.value ? 'border-brand-primary bg-brand-primary text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-brand-primary/40'}`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
