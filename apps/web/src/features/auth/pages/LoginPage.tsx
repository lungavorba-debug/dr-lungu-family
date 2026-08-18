import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiClientError, useAuth } from '../context/AuthContext';
import { useClinicSettings } from '../../settings/context/ClinicSettingsContext';
import { ClinicBrandMark } from '../../shell/components/ClinicBrandMark';

export function LoginPage() {
  const { login } = useAuth();
  const { settings } = useClinicSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Completați email-ul și parola.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password, rememberMe);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Nume de utilizator sau parolă incorecte.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <ClinicBrandMark size="lg" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {settings?.branding.app_name ?? 'MedScreen Festival'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {settings?.branding.login_tagline ?? settings?.clinic.slogan ?? 'Platformă de screening medical'}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Adresă de email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-14 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 focus:ring-brand-primary/30 ${
                error ? 'border-red-400' : 'border-slate-300 focus:border-brand-primary'
              }`}
              placeholder="operator@medscreen.ro"
              aria-label="Adresă email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Parolă
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`h-14 w-full rounded-lg border px-4 text-base outline-none transition focus:ring-2 focus:ring-brand-primary/30 ${
                error ? 'border-red-400' : 'border-slate-300 focus:border-brand-primary'
              }`}
              placeholder="••••••••"
              aria-label="Parolă"
            />
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-brand-primary hover:underline">
              Ați uitat parola?
            </Link>
          </div>

          <label className="flex min-h-touch cursor-pointer items-center gap-3 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            Ține-mă minte pe acest dispozitiv
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-14 w-full rounded-lg bg-brand-primary text-base font-semibold uppercase tracking-wide text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Se autentifică...' : 'Autentificare în sistem'}
          </button>
        </form>
      </div>
    </div>
  );
}
