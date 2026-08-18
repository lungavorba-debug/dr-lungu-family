import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiClientError, apiClient, setAuthToken } from '../../../shared/lib/api-client';
import { useAuth } from '../../auth/context/AuthContext';
import { ClinicBrandMark } from '../../shell/components/ClinicBrandMark';

export function ChangePasswordPage() {
  const { user, establishSession, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const forceChange = user?.must_change_password ?? false;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Parolele noi nu coincid.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Parola nouă trebuie să aibă cel puțin 8 caractere.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiClient.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      establishSession(data, true);
      setAuthToken(data.token, true);
      navigate(forceChange ? '/' : '/profile', { replace: true });
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Parola nu a putut fi schimbată.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {forceChange ? 'Schimbare parolă obligatorie' : 'Schimbare parolă'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {forceChange
            ? 'Trebuie să setați o parolă nouă înainte de a continua.'
            : 'Actualizați parola contului dvs.'}
        </p>
      </div>

      {error ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Parola curentă</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-slate-300 px-3"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Parola nouă</span>
          <input
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-slate-300 px-3"
            required
            minLength={8}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Confirmare parolă nouă</span>
          <input
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12 w-full rounded-lg border border-slate-300 px-3"
            required
            minLength={8}
          />
        </label>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white hover:bg-brand-secondary disabled:opacity-60"
        >
          {isSubmitting ? 'Se salvează...' : 'Salvează parola'}
        </button>
      </form>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const result = await apiClient.forgotPassword({ email: email.trim().toLowerCase() });
      if (result.email_sent) {
        setMessage('Dacă adresa de email există în sistem, veți primi instrucțiuni de resetare.');
      } else {
        setMessage(
          'Resetarea prin email nu este disponibilă momentan (serviciul SMTP sau URL-ul aplicației nu este configurat). Contactați administratorul pentru resetarea parolei.',
        );
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Solicitarea nu a putut fi trimisă.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <ClinicBrandMark size="lg" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Resetare parolă</h1>
          <p className="mt-1 text-sm text-slate-500">Introduceți email-ul contului dvs.</p>
        </div>

        {error ? (
          <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            message.includes('nu este disponibilă')
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-300 px-3"
              required
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white hover:bg-brand-secondary disabled:opacity-60"
          >
            {isSubmitting ? 'Se trimite...' : 'Trimite link de resetare'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand-primary hover:underline">
            Înapoi la autentificare
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Linkul de resetare este invalid.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Parolele nu coincid.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.resetPasswordWithToken({ token, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Resetarea parolei a eșuat.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Setare parolă nouă</h1>

        {success ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-emerald-700">Parola a fost resetată cu succes.</p>
            <Link
              to="/login"
              className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white"
            >
              Autentificare
            </Link>
          </div>
        ) : (
          <>
            {error ? (
              <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Parola nouă</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 px-3"
                  required
                  minLength={8}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Confirmare parolă</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 w-full rounded-lg border border-slate-300 px-3"
                  required
                  minLength={8}
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? 'Se salvează...' : 'Resetează parola'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
