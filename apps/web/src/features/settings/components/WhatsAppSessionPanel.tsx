import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiClientError } from '../../../shared/lib/api-client';
import { apiClient } from '../../../shared/lib/api-client';
import { useWhatsAppSession } from '../hooks/useWhatsAppSession';

function resolveError(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.errorCode === 'FORBIDDEN') {
      return 'Nu aveți permisiunea de administrator pentru conectarea WhatsApp.';
    }
    if (error.errorCode === 'UNAUTHORIZED') {
      return 'Sesiunea a expirat. Reautentificați-vă.';
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Conectarea WhatsApp a eșuat.';
}

export function WhatsAppSessionPanel() {
  const queryClient = useQueryClient();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const {
    data: session,
    isLoading,
    error: sessionError,
    isError: sessionIsError,
  } = useWhatsAppSession({ refetchIntervalMs: 3000 });

  const connectMutation = useMutation({
    mutationFn: () => apiClient.connectWhatsAppSession(),
    onMutate: () => {
      setStatusMessage(null);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['whatsapp-session'], data);
      if (data.connected) {
        setStatusMessage('Sesiunea WhatsApp este conectată.');
        return;
      }
      if (data.qr_data_url) {
        setStatusMessage('Codul QR a fost generat. Scanează-l cu telefonul clinicii.');
        return;
      }
      setStatusMessage('Conectarea a pornit. Codul QR va apărea în câteva secunde.');
    },
    onError: (error) => {
      setStatusMessage(null);
      window.alert(resolveError(error));
    },
  });

  const sessionData = connectMutation.data ?? session;
  const connected = sessionData?.connected ?? false;
  const initializing = sessionData?.initializing ?? false;
  const reconnecting = sessionData?.reconnecting ?? false;
  const lastError = sessionData?.last_error ?? null;
  const qrDataUrl = sessionData?.qr_data_url ?? null;
  const actionError = connectMutation.error ?? (sessionIsError ? sessionError : null);

  return (
    <div className="space-y-5">
      <div
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
          connected
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-rose-200 bg-rose-50 text-rose-800'
        }`}
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true">{connected ? '🟢' : '🔴'}</span>
        <span>{connected ? 'Conectat' : 'Deconectat'}</span>
        {initializing && !connected ? (
          <span className="text-xs font-normal opacity-80">— se inițializează...</span>
        ) : null}
        {reconnecting && !connected && !initializing ? (
          <span className="text-xs font-normal opacity-80">— reconectare automată...</span>
        ) : null}
      </div>

      {lastError && !connected ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {lastError}
        </div>
      ) : null}

      <p className="text-sm text-slate-600">
        Sesiunea WhatsApp rulează pe server și este partajată de toți operatorii. Conectați telefonul
        clinicii o singură dată; sesiunea supraviețuiește repornirii serverului.
      </p>

      {!connected ? (
        <button
          type="button"
          disabled={connectMutation.isPending}
          onClick={() => connectMutation.mutate()}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connectMutation.isPending ? 'Se pornește conexiunea...' : 'Conectează WhatsApp'}
        </button>
      ) : null}

      {statusMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {statusMessage}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {resolveError(actionError)}
        </div>
      ) : null}

      {!connected && qrDataUrl ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-medium text-slate-800">Scanează codul QR</p>
          <p className="text-sm text-slate-600">
            Telefon clinicii → WhatsApp → Dispozitive conectate → Scanare cod QR
          </p>
          <img
            src={qrDataUrl}
            alt="Cod QR WhatsApp"
            className="mx-auto h-[280px] w-[280px] rounded-lg border border-slate-200 bg-white"
          />
          <p className="text-xs text-slate-500">Codul se reîmprospătează automat.</p>
        </div>
      ) : null}

      {!connected && !qrDataUrl && (initializing || reconnecting || isLoading || connectMutation.isPending) ? (
        <p className="text-sm text-slate-500">
          {reconnecting ? 'Se reconectează automat la WhatsApp...' : 'Se generează codul QR...'}
        </p>
      ) : null}
    </div>
  );
}
