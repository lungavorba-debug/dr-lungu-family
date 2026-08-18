import { ConversationTimer } from './ConversationTimer';

interface VoiceScreeningAssistantButtonProps {
  status: 'idle' | 'recording' | 'processing' | 'error';
  recordingSeconds: number;
  error: string | null;
  aiLoading?: boolean;
  aiUnavailable: boolean;
  aiProvider?: string | null;
  isSupported: boolean;
  onStart: () => void;
  onStop: () => void;
  onRefreshAi?: () => void;
}

export function VoiceScreeningAssistantButton({
  status,
  recordingSeconds,
  error,
  aiLoading = false,
  aiUnavailable,
  aiProvider,
  isSupported,
  onStart,
  onStop,
  onRefreshAi,
}: VoiceScreeningAssistantButtonProps) {
  const isRecording = status === 'recording';
  const isProcessing = status === 'processing';

  return (
    <section className="rounded-2xl border border-brand-primary/20 bg-gradient-to-br from-brand-primary/5 to-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-primary">Asistent vocal AI</p>
          <p className="mt-1 text-sm text-slate-600">
            Ascultă răspunsurile participantului și completează automat câmpurile goale.
          </p>
        </div>
        {isRecording ? (
          <ConversationTimer elapsedSeconds={recordingSeconds} active compact />
        ) : null}
      </div>

      {aiLoading ? (
        <p className="mt-3 text-xs text-slate-500">Se verifică disponibilitatea AI...</p>
      ) : null}

      {!aiLoading && aiProvider ? (
        <p className="mt-3 text-xs text-emerald-700">
          Provider activ: {aiProvider}
        </p>
      ) : null}

      {!aiLoading && aiUnavailable ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-700">
            AI indisponibil — setați OPENAI_API_KEY în .env sau configurați AI în setările clinicii.
          </p>
          {onRefreshAi ? (
            <button
              type="button"
              onClick={onRefreshAi}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800"
            >
              Reîncarcă status AI
            </button>
          ) : null}
        </div>
      ) : null}

      {!isSupported ? (
        <p className="mt-3 text-xs text-amber-700">
          Browserul nu suportă înregistrarea audio.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-xs text-amber-700" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {!isRecording && !isProcessing ? (
          <button
            type="button"
            disabled={!isSupported || aiLoading || aiUnavailable}
            onClick={onStart}
            className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden>🎙️</span>
            Pornește ascultarea AI
          </button>
        ) : null}

        {isRecording ? (
          <button
            type="button"
            onClick={onStop}
            className="inline-flex min-h-touch flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
          >
            Oprește și procesează
          </button>
        ) : null}

        {isProcessing ? (
          <button
            type="button"
            disabled
            className="inline-flex min-h-touch flex-1 items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Se procesează...
          </button>
        ) : null}
      </div>
    </section>
  );
}
