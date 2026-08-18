import { AiProcessingProgress } from './AiProcessingProgress';
import { AiStatusIndicator } from './AiStatusIndicator';
import { ConversationTimer } from './ConversationTimer';
import type { AiConversationStatus } from '../types/providers';

interface ConversationControlsProps {
  assistantOpen: boolean;
  assistantStarted: boolean;
  aiStatus: AiConversationStatus;
  recordingSeconds: number;
  aiMode: 'mock' | 'production';
  transcriptionError: string | null;
  recordingError: string | null;
  isRecording: boolean;
  isPaused: boolean;
  isTranscribing: boolean;
  isExtracting: boolean;
  isProcessing: boolean;
  onOpenAssistant: () => void;
  onStartAssistant: () => void;
  onStartRecording: () => void;
  onPauseRecording: () => void;
  onResumeRecording: () => void;
  onStopRecording: () => void;
  onRetryTranscription: () => void;
}

export function ConversationControls({
  assistantOpen,
  assistantStarted,
  aiStatus,
  recordingSeconds,
  aiMode,
  transcriptionError,
  recordingError,
  isRecording,
  isPaused,
  isTranscribing,
  isExtracting,
  isProcessing,
  onOpenAssistant,
  onStartAssistant,
  onStartRecording,
  onPauseRecording,
  onResumeRecording,
  onStopRecording,
  onRetryTranscription,
}: ConversationControlsProps) {
  const timerActive = isRecording || isPaused;

  return (
    <section className="space-y-4 rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-medical sm:p-6">
      {!assistantOpen ? (
        <button
          type="button"
          onClick={onOpenAssistant}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border border-brand-primary/30 bg-brand-primary/5 text-base font-semibold text-brand-primary transition hover:bg-brand-primary/10"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Asistent AI
          {aiMode === 'mock' ? (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
              demo
            </span>
          ) : null}
        </button>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <AiStatusIndicator status={aiStatus} />
            <ConversationTimer elapsedSeconds={recordingSeconds} active={timerActive} />
          </div>

          {!assistantStarted ? (
            <button
              type="button"
              onClick={onStartAssistant}
              className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand-primary text-base font-semibold text-white transition hover:bg-brand-secondary"
            >
              Pornește asistentul
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {!isRecording && !isPaused && !isProcessing ? (
                <button
                  type="button"
                  onClick={onStartRecording}
                  className="min-h-touch flex-1 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:bg-brand-secondary"
                >
                  Start
                </button>
              ) : null}

              {isRecording ? (
                <button
                  type="button"
                  onClick={onPauseRecording}
                  className="min-h-touch flex-1 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
                >
                  Pauză
                </button>
              ) : null}

              {isPaused ? (
                <button
                  type="button"
                  onClick={onResumeRecording}
                  className="min-h-touch flex-1 rounded-xl bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:bg-brand-secondary"
                >
                  Continuă
                </button>
              ) : null}

              {isRecording || isPaused ? (
                <button
                  type="button"
                  onClick={onStopRecording}
                  className="min-h-touch flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Stop
                </button>
              ) : null}
            </div>
          )}

          <AiProcessingProgress isTranscribing={isTranscribing} isExtracting={isExtracting} />

          {recordingError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {recordingError}
            </div>
          ) : null}

          {transcriptionError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p>{transcriptionError}</p>
              <button
                type="button"
                onClick={onRetryTranscription}
                className="mt-2 font-semibold text-brand-primary underline"
              >
                Reîncearcă transcrierea
              </button>
            </div>
          ) : null}

          <p className="text-center text-sm text-slate-500">
            {isRecording
              ? 'Înregistrare activă — apăsați Pauză sau Stop când ați terminat.'
              : isPaused
                ? 'Înregistrare în pauză — apăsați Continuă sau Stop.'
                : isTranscribing
                  ? 'Se procesează transcrierea...'
                  : isExtracting
                    ? 'Se completează formularul automat...'
                    : assistantStarted
                      ? 'Apăsați Start pentru o nouă înregistrare.'
                      : 'Porniți asistentul pentru a dicta conversația.'}
          </p>
        </>
      )}
    </section>
  );
}
