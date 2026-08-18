import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { fieldHintBadge, fieldHintClass } from '../../conversation/lib/field-hint-styles';
import type { AiFieldHint } from '../../conversation/types/providers';
import {
  MEASUREMENTS_TOUCH_DOCK_INSET_PX,
  MEASUREMENTS_TOUCH_DOCK_SCROLL_MARGIN,
} from '../lib/measurements-dock-layout';
import { scrollMeasurementFieldIntoView } from '../../../../shared/hooks/useTouchNumericInput';

interface NumericMeasurementInputProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  hideLabel?: boolean;
  onChange: (value: string) => void;
  onComplete?: () => void;
  onFocus?: () => void;
  highlight?: boolean;
  reviewHighlight?: boolean;
  aiHint?: AiFieldHint;
  inputRef?: (element: HTMLInputElement | null) => void;
  useTouchKeypad?: boolean;
}

export function NumericMeasurementInput({
  id,
  label,
  value,
  unit,
  onChange,
  onComplete,
  onFocus,
  highlight = false,
  reviewHighlight = false,
  aiHint,
  inputRef,
  useTouchKeypad = true,
  hideLabel = false,
}: NumericMeasurementInputProps) {
  const localRef = useRef<HTMLInputElement | null>(null);

  function setRefs(element: HTMLInputElement | null) {
    localRef.current = element;
    inputRef?.(element);
  }

  function handleActivate() {
    onFocus?.();
    localRef.current?.focus({ preventScroll: false });
    scrollMeasurementFieldIntoView(localRef.current, {
      bottomInsetPx: useTouchKeypad ? MEASUREMENTS_TOUCH_DOCK_INSET_PX : 0,
    });
  }

  function handleFocus() {
    handleActivate();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      onComplete?.();
    }
  }

  return (
    <label htmlFor={id} className="block">
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="mb-2 flex items-center text-sm font-medium text-slate-700">
          {label} ({unit})
          {fieldHintBadge(aiHint) ? (
            <span className="ml-2 inline-flex rounded-full bg-brand-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-primary">
              {fieldHintBadge(aiHint)}
            </span>
          ) : null}
        </span>
      )}
      <input
        id={id}
        ref={setRefs}
        type="text"
        inputMode={useTouchKeypad ? 'none' : 'numeric'}
        readOnly={useTouchKeypad}
        value={value}
        onChange={(event) => {
          if (!useTouchKeypad) {
            onChange(event.target.value);
          }
        }}
        onFocus={handleFocus}
        onPointerDown={(event) => {
          if (!useTouchKeypad) return;
          event.preventDefault();
          handleActivate();
        }}
        onKeyDown={handleKeyDown}
        className={`h-16 w-full rounded-xl border px-4 text-2xl font-semibold tabular-nums outline-none transition focus:ring-2 focus:ring-brand-primary/30 ${
          useTouchKeypad ? 'cursor-pointer touch-manipulation' : ''
        } ${
          reviewHighlight
            ? 'border-red-500 bg-red-50 ring-2 ring-red-300'
            : highlight
              ? 'border-amber-400 bg-amber-50'
              : 'border-slate-300 focus:border-brand-primary'
        } ${fieldHintClass(aiHint)} ${useTouchKeypad ? MEASUREMENTS_TOUCH_DOCK_SCROLL_MARGIN : ''}`}
      />
    </label>
  );
}

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onDecimal: () => void;
  onBackspace: () => void;
  onNext: () => void;
}

export function NumericKeypad({ onDigit, onDecimal, onBackspace, onNext }: NumericKeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <div className="border-t border-slate-200 bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-3 gap-1.5">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (key === '⌫') onBackspace();
              else if (key === '.') onDecimal();
              else onDigit(key);
            }}
            className="flex min-h-[44px] items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-800 transition active:scale-[0.98] active:bg-brand-primary/10 touch-manipulation"
          >
            {key}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="mt-1.5 flex min-h-[44px] w-full items-center justify-center rounded-lg bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary touch-manipulation"
      >
        Următorul câmp →
      </button>
    </div>
  );
}

interface BooleanChipGroupProps {
  label: string;
  value: boolean | null;
  onChange: (value: boolean | null) => void;
  hint?: string;
}

export function BooleanChipGroup({ label, value, onChange, hint }: BooleanChipGroupProps) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700">{label}</legend>
      {hint ? <p className="mb-2 text-xs leading-relaxed text-slate-500">{hint}</p> : null}
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: true, label: 'Da' },
          { value: false, label: 'Nu' },
        ].map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`min-h-[56px] rounded-xl border text-base font-semibold transition ${
              value === option.value
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function ChipGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-2 block text-sm font-medium text-slate-700">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={`min-h-touch rounded-full border px-4 text-sm font-semibold transition ${
              value === option.value
                ? 'border-brand-primary bg-brand-primary text-white'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function WarningConfirmDialog({
  warnings,
  onConfirm,
  onCancel,
}: {
  warnings: { message: string }[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Confirmați valorile</h2>
        <p className="mt-4 text-sm text-slate-600">
          Aceste valori sunt informative. Puteți continua după confirmare.
        </p>
        <ul className="mt-4 space-y-2">
          {[...new Set(warnings.map((warning) => warning.message))].map((message) => (
            <li key={message} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {message}
            </li>
          ))}
        </ul>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-touch rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
          >
            Revizuiește
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[56px] rounded-xl bg-brand-primary text-sm font-semibold text-white"
          >
            Confirmă și continuă
          </button>
        </div>
      </div>
    </div>
  );
}

export function useFocusChain(fieldIds: string[]) {
  const refs = useRef<Record<string, HTMLInputElement | null>>({});

  const setRef = useCallback((id: string) => {
    return (element: HTMLInputElement | null) => {
      refs.current[id] = element;
    };
  }, []);

  const focusField = useCallback((id: string) => {
    requestAnimationFrame(() => {
      refs.current[id]?.focus({ preventScroll: false });
    });
  }, []);

  const focusNext = useCallback(
    (currentId: string) => {
      const index = fieldIds.indexOf(currentId);
      const nextId = fieldIds[index + 1];
      if (nextId) {
        requestAnimationFrame(() => {
          refs.current[nextId]?.focus({ preventScroll: false });
        });
      }
    },
    [fieldIds],
  );

  return { setRef, focusField, focusNext };
}

export function ReadOnlyBmiField({ value, highlight = false }: { value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'border-amber-300 bg-amber-50/60' : 'border-brand-primary/20 bg-brand-primary/5'
      }`}
    >
      <p className="text-sm font-medium text-slate-600">BMI (calculat automat)</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-brand-primary">{value || '—'}</p>
    </div>
  );
}

export function ReadOnlyIdealWeightField({ value, highlight = false }: { value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        highlight ? 'border-amber-300 bg-amber-50/60' : 'border-brand-primary/20 bg-brand-primary/5'
      }`}
    >
      <p className="text-sm font-medium text-slate-600">Greutate ideală (calculată automat)</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-brand-primary">
        {value ? `${value} kg` : '—'}
      </p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

export type ActiveNumericField = keyof import('../types/measurements-form').MeasurementsFormState;
