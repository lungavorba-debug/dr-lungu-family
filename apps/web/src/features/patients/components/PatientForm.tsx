import { useState, type FormEvent } from 'react';
import { createPatientSchema, formatPhoneInput } from '@medscreen/shared';
import type { CreatePatientRequest, PatientGender } from '@medscreen/types';

const QUICK_CITIES = ['Pitești', 'Curtea de Argeș', 'Mioveni', 'Câmpulung', 'Costești', 'Topoloveni'] as const;

interface PatientFormProps {
  initialPhone: string;
  isSubmitting: boolean;
  serverError: string | null;
  onSubmit: (payload: CreatePatientRequest) => void;
  onCancel: () => void;
}

interface FormState {
  first_name: string;
  last_name: string;
  phone: string;
  age: string;
  gender: PatientGender | '';
  city: string;
}

interface FieldErrors {
  first_name?: string;
  last_name?: string;
  phone?: string;
  age?: string;
  gender?: string;
  city?: string;
}

export function PatientForm({
  initialPhone,
  isSubmitting,
  serverError,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const [form, setForm] = useState<FormState>({
    first_name: '',
    last_name: '',
    phone: formatPhoneInput(initialPhone),
    age: '',
    gender: '',
    city: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [customCity, setCustomCity] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleCitySelect(city: string) {
    setCustomCity(false);
    updateField('city', city);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = createPatientSchema.safeParse({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone,
      age: form.age,
      gender: form.gender || undefined,
      city: form.city,
    });

    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.errors) {
        const field = issue.path[0];
        if (typeof field === 'string' && !nextErrors[field as keyof FieldErrors]) {
          nextErrors[field as keyof FieldErrors] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onSubmit(parsed.data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">Pacient nou</p>
        <p className="mt-1 text-sm text-amber-700">
          Nu am găsit acest număr în baza de date. Completați datele demografice.
        </p>
      </div>

      {serverError ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {serverError}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="last_name"
          label="Nume"
          value={form.last_name}
          error={errors.last_name}
          onChange={(value) => updateField('last_name', value)}
          autoComplete="family-name"
        />
        <Field
          id="first_name"
          label="Prenume"
          value={form.first_name}
          error={errors.first_name}
          onChange={(value) => updateField('first_name', value)}
          autoComplete="given-name"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="phone"
          label="Telefon"
          value={form.phone}
          error={errors.phone}
          onChange={(value) => updateField('phone', formatPhoneInput(value))}
          inputMode="tel"
          autoComplete="tel"
        />
        <Field
          id="age"
          label="Vârstă"
          value={form.age}
          error={errors.age}
          onChange={(value) => updateField('age', value.replace(/\D/g, ''))}
          inputMode="numeric"
          autoComplete="off"
        />
      </div>

      <fieldset>
        <legend className="mb-3 block text-sm font-medium text-slate-700">Sex</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['M', 'F'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => updateField('gender', value)}
              className={`min-h-[56px] rounded-xl border text-base font-semibold transition ${
                form.gender === value
                  ? 'border-brand-primary bg-brand-primary text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-primary/40'
              }`}
              aria-pressed={form.gender === value}
            >
              {value === 'M' ? 'Masculin' : 'Feminin'}
            </button>
          ))}
        </div>
        {errors.gender ? <p className="mt-2 text-sm text-red-600">{errors.gender}</p> : null}
      </fieldset>

      <fieldset>
        <legend className="mb-3 block text-sm font-medium text-slate-700">Localitate</legend>
        <div className="flex flex-wrap gap-2">
          {QUICK_CITIES.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => handleCitySelect(city)}
              className={`min-h-touch rounded-full border px-4 text-sm font-medium transition ${
                form.city === city && !customCity
                  ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/30'
              }`}
            >
              {city}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustomCity(true);
              updateField('city', '');
            }}
            className={`min-h-touch rounded-full border px-4 text-sm font-medium transition ${
              customCity
                ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-primary/30'
            }`}
          >
            Altă localitate
          </button>
        </div>
        {customCity ? (
          <div className="mt-3">
            <Field
              id="city"
              label="Introduceți localitatea"
              value={form.city}
              error={errors.city}
              onChange={(value) => updateField('city', value)}
              autoComplete="address-level2"
            />
          </div>
        ) : errors.city ? (
          <p className="mt-2 text-sm text-red-600">{errors.city}</p>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex min-h-[56px] flex-1 items-center justify-center rounded-2xl bg-brand-primary text-base font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? 'Se înregistrează...' : 'Înregistrează pacientul'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-touch flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Anulează
        </button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  error,
  onChange,
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  inputMode?: 'text' | 'tel' | 'numeric';
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className={`h-14 w-full rounded-xl border px-4 text-base outline-none transition focus:ring-2 focus:ring-brand-primary/30 ${
          error ? 'border-red-400' : 'border-slate-300 focus:border-brand-primary'
        }`}
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
