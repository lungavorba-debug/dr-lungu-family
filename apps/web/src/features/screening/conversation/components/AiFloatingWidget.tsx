import { createPortal } from 'react-dom';
import { ConversationTimer } from './ConversationTimer';
import type { AiConversationStatus } from '../types/providers';

function resolveStatusLabel(
  aiStatus: AiConversationStatus,
  isListening: boolean,
  isPaused: boolean,
  isTranscribing: boolean,
  isExtracting: boolean,
): string {
  if (isPaused) return 'Paused';
  if (isTranscribing) return 'Transcribing...';
  if (isExtracting) return 'Processing...';
  if (aiStatus === 'completed') return 'Completed';
  if (isListening) return 'Listening...';
  if (aiStatus === 'ready') return 'Ready';
  return 'Inactive';
}

interface AiFloatingWidgetProps {
  aiStatus: AiConversationStatus;
  recordingSeconds: number;
  aiMode: 'mock' | 'production';
  transcriptionError: string | null;
  recordingError: string | null;
  aiUnavailable: boolean;
  isListening: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  isExtracting: boolean;
  isProcessing: boolean;
  assistantStarted: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRetryTranscription: () => void;
}

export function AiFloatingWidget({
  aiStatus,
  recordingSeconds,
  aiMode,
  transcriptionError,
  recordingError,
  aiUnavailable,
  isListening,
  isPaused,
  isTranscribing,
  isExtracting,
  isProcessing,
  assistantStarted,
  onStart,
  onPause,
  onResume,
  onStop,
  onRetryTranscription,
}: AiFloatingWidgetProps) {
  const statusLabel = resolveStatusLabel(
    aiStatus,
    isListening,
    isPaused,
    isTranscribing,
    isExtracting,
  );
  const timerActive = isListening || isPaused;
  const canStart = !isListening && !isPaused && !isProcessing;
  const showStop = isListening || isPaused || isProcessing;

  const widget = (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[60] flex max-w-[min(100vw-2rem,22rem)] flex-col gap-2 pb-[env(safe-area-inset-bottom,0px)]"
      aria-live="polite"
    >
      <div className="pointer-events-auto rounded-2xl border border-brand-primary/20 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
              Asistent AI
              {aiMode === 'mock' ? (
                <span className="ml-2 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                  demo
                </span>
              ) : null}
            </p>
            <p className="truncate text-sm font-medium text-slate-800">{statusLabel}</p>
          </div>
          <ConversationTimer elapsedSeconds={recordingSeconds} active={timerActive} compact />
        </div>

        {aiUnavailable ? (
          <p className="mt-2 text-xs text-amber-700">
            AI indisponibil — completați manual. Puteți reîncerca.
          </p>
        ) : null}

        {recordingError ? (
          <p className="mt-2 text-xs text-red-600">{recordingError}</p>
        ) : null}

        {transcriptionError ? (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-amber-700">{transcriptionError}</p>
            <button
              type="button"
              onClick={onRetryTranscription}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Reîncearcă
            </button>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {canStart ? (
            <button
              type="button"
              onClick={onStart}
              className="min-h-touch flex-1 rounded-xl bg-brand-primary px-3 py-2 text-sm font-semibold text-white"
            >
              {assistantStarted ? 'Pornește ascultarea AI' : 'Pornește ascultarea AI'}
            </button>
          ) : null}

          {isListening ? (
            <button
              type="button"
              onClick={onPause}
              className="min-h-touch flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
            >
              Pause
            </button>
          ) : null}

          {isPaused ? (
            <button
              type="button"
              onClick={onResume}
              className="min-h-touch flex-1 rounded-xl bg-brand-accent px-3 py-2 text-sm font-semibold text-white"
            >
              Resume
            </button>
          ) : null}

          {showStop ? (
            <button
              type="button"
              onClick={onStop}
              disabled={isProcessing && !isPaused}
              className="min-h-touch flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50"
            >
              Stop
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return widget;
  }

  return createPortal(widget, document.body);
}
