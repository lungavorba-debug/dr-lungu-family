import type { ReactNode } from 'react';

interface ConfirmActionDialogProps {
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmTone?: 'primary' | 'danger';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionDialog({
  title,
  description,
  confirmLabel,
  cancelLabel = 'Anulează',
  confirmTone = 'primary',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmActionDialogProps) {
  const confirmClassName =
    confirmTone === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-brand-primary hover:bg-brand-secondary';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <div className="mt-4 text-sm text-slate-600">{description}</div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="min-h-touch rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`min-h-touch rounded-xl text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmClassName}`}
          >
            {isPending ? 'Se procesează...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
