import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiClientError, apiClient } from '../../../shared/lib/api-client';
import { useAuth } from '../context/AuthContext';
import { useSetup } from '../context/SetupContext';

export function InitialSetupPage() {
  const { establishSession } = useAuth();
  const { refreshSetupStatus } = useSetup();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Completați toate câmpurile obligatorii.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiClient.createInitialAdmin({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
      establishSession(data, true);
      await refreshSetupStatus();
      navigate('/', { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Configurarea inițială nu a putut fi finalizată.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-2xl font-bold text-white">
            MS
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Configurare inițială</h1>
          <p className="mt-2 text-sm text-slate-500">
            Nu există un administrator activ. Creați contul administrator principal pentru a porni
            platforma.
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="setup-first-name" className="mb-2 block text-sm font-medium text-slate-700">
                Prenume
              </label>
              <input
                id="setup-first-name"
                type="text"
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="h-14 w-full rounded-lg border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
            <div>
              <label htmlFor="setup-last-name" className="mb-2 block text-sm font-medium text-slate-700">
                Nume
              </label>
              <input
                id="setup-last-name"
                type="text"
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="h-14 w-full rounded-lg border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="setup-email" className="mb-2 block text-sm font-medium text-slate-700">
              Adresă de email
            </label>
            <input
              id="setup-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-14 w-full rounded-lg border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
              placeholder="admin@medscreen.ro"
            />
          </div>

          <div>
            <label htmlFor="setup-password" className="mb-2 block text-sm font-medium text-slate-700">
              Parolă
            </label>
            <input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-14 w-full rounded-lg border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
          </div>

          <div>
            <label
              htmlFor="setup-password-confirm"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Confirmă parola
            </label>
            <input
              id="setup-password-confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-14 w-full rounded-lg border border-slate-300 px-4 text-base outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30"
            />
            {passwordsMismatch ? (
              <p className="mt-2 text-xs text-red-600">Parolele nu coincid.</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || passwordsMismatch}
            className="h-14 w-full rounded-lg bg-brand-primary text-base font-semibold uppercase tracking-wide text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Se configurează...' : 'Creează administratorul'}
          </button>
        </form>
      </div>
    </div>
  );
}
