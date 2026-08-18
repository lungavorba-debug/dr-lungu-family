import { useState, type FormEvent } from 'react';
import { formatPhoneInput, isValidRomanianPhone, normalizePhone } from '@medscreen/shared';

export type PatientSearchMode = 'phone' | 'name';

interface PatientSearchFormProps {
  onSearch: (params: { phone?: string; search?: string }) => void;
  isSearching?: boolean;
  initialMode?: PatientSearchMode;
}

export function PatientSearchForm({
  onSearch,
  isSearching = false,
  initialMode = 'name',
}: PatientSearchFormProps) {
  const [mode, setMode] = useState<PatientSearchMode>(initialMode);
  const [phoneInput, setPhoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === 'phone') {
      if (!phoneInput.trim()) {
        setError('Introduceți numărul de telefon.');
        return;
      }
      if (!isValidRomanianPhone(phoneInput)) {
        setError('Introduceți un număr românesc valid (10 cifre, ex: 0722123456).');
        return;
      }
      onSearch({ phone: normalizePhone(phoneInput) });
      return;
    }

    if (!nameInput.trim()) {
      setError('Introduceți numele sau prenumele pacientului.');
      return;
    }
    if (nameInput.trim().length < 2) {
      setError('Introduceți minim 2 caractere pentru căutare.');
      return;
    }
    onSearch({ search: nameInput.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setMode('name');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === 'name'
              ? 'bg-brand-primary text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          După nume
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('phone');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
            mode === 'phone'
              ? 'bg-brand-primary text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          După telefon
        </button>
      </div>

      <div className="mt-4">
        {mode === 'phone' ? (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Telefon pacient</span>
            <input
              type="tel"
              inputMode="numeric"
              value={phoneInput}
              onChange={(event) => setPhoneInput(formatPhoneInput(event.target.value))}
              placeholder="0722 123 456"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Nume sau prenume</span>
            <input
              type="search"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              placeholder="Ex: Popescu"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
            />
          </label>
        )}
      </div>

      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isSearching}
        className="mt-4 inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60 sm:w-auto sm:px-6"
      >
        {isSearching ? 'Se caută...' : 'Caută pacient'}
      </button>
    </form>
  );
}
