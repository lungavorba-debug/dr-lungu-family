import { useState, type FormEvent } from 'react';
import type { AdminUserListItem } from '@medscreen/types';

interface ResetPasswordDialogProps {
  user: AdminUserListItem;
  isPending?: boolean;
  errorMessage?: string | null;
  onSubmit: (password: string) => void;
  onClose: () => void;
}

export function ResetPasswordDialog({
  user,
  isPending = false,
  errorMessage,
  onSubmit,
  onClose,
}: ResetPasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    onSubmit(password);
  };

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">Resetare parolă</h2>
        <p className="mt-2 text-sm text-slate-600">
          Setați o parolă nouă pentru{' '}
          <span className="font-semibold text-slate-900">
            {user.first_name} {user.last_name}
          </span>
          .
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="reset-password" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Parolă nouă
            </label>
            <input
              id="reset-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div>
            <label
              htmlFor="reset-password-confirm"
              className="text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              Confirmă parola
            </label>
            <input
              id="reset-password-confirm"
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
            {passwordsMismatch ? (
              <p className="mt-2 text-xs text-red-600">Parolele nu coincid.</p>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-touch rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isPending || passwordsMismatch}
              className="min-h-touch rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Se resetează...' : 'Resetează parola'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
