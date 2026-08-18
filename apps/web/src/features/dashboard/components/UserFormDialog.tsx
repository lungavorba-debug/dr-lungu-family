import { useEffect, useState, type FormEvent } from 'react';
import type { AdminUserListItem, RoleName } from '@medscreen/types';
import { ROLES } from '@medscreen/types';
import { ROLE_LABELS } from '../../shell/config/navigation';

export interface UserFormValues {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: RoleName;
}

interface UserFormDialogProps {
  mode: 'create' | 'edit';
  user?: AdminUserListItem;
  isPending?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: UserFormValues) => void;
  onClose: () => void;
}

const ROLE_OPTIONS: RoleName[] = [ROLES.ADMIN, ROLES.MEDIC, ROLES.OPERATOR];

export function UserFormDialog({
  mode,
  user,
  isPending = false,
  errorMessage,
  onSubmit,
  onClose,
}: UserFormDialogProps) {
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<RoleName>(user?.role ?? ROLES.OPERATOR);

  useEffect(() => {
    if (mode === 'edit' && user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setRole(user.role);
      setPassword('');
    }
  }, [mode, user]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim(),
      password,
      role,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === 'create' ? 'Creare utilizator' : 'Editare utilizator'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'create'
            ? 'Completați datele noului cont. Parola trebuie să aibă cel puțin 8 caractere.'
            : 'Actualizați profilul și rolul utilizatorului.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="user-first-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Prenume
              </label>
              <input
                id="user-first-name"
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="user-last-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Nume
              </label>
              <input
                id="user-last-name"
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="user-email" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          {mode === 'create' ? (
            <div>
              <label htmlFor="user-password" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Parolă inițială
              </label>
              <input
                id="user-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="user-role" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Rol
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) => setRole(event.target.value as RoleName)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {ROLE_LABELS[option]}
                </option>
              ))}
            </select>
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
              disabled={isPending}
              className="min-h-touch rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Se salvează...' : mode === 'create' ? 'Creează utilizator' : 'Salvează modificările'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
