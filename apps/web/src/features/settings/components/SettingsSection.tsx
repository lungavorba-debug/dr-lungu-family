import type { ReactNode } from 'react';

export function SettingsSection({
  title,
  description,
  children,
  onSave,
  isPending,
  message,
  error,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onSave?: () => void;
  isPending?: boolean;
  message?: string | null;
  error?: string | null;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <div className="space-y-4">{children}</div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}

      {onSave ? (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onSave}
            disabled={isPending}
            className="rounded-xl bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Se salvează…' : 'Salvează secțiunea'}
          </button>
        </div>
      ) : null}
    </section>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export const inputClassName =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2';

export const textareaClassName =
  'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2';
