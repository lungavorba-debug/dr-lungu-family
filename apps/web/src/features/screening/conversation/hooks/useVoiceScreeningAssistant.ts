import { useCallback, useEffect, useRef, useState } from 'react';
import { hasVoiceExtractableFields } from '@medscreen/shared';
import type { ParseScreeningVoiceResponse } from '@medscreen/types';
import { ApiClientError, apiClient } from '../../../../shared/lib/api-client';
import { MediaRecorderSpeechProvider } from '../providers/media-recorder-speech.provider';
import { blobToBase64 } from '../lib/apply-voice-extraction';
import { useAiAvailability } from './useAiAvailability';

export type VoiceAssistantStatus = 'idle' | 'recording' | 'processing' | 'error';

export function useVoiceScreeningAssistant() {
  const speechRef = useRef<MediaRecorderSpeechProvider | null>(null);
  const timerRef = useRef<number | null>(null);

  const {
    availability,
    loading: aiLoading,
    error: aiAvailabilityError,
    voiceReady,
    aiUnavailable,
    refresh: refreshAiAvailability,
  } = useAiAvailability();

  const [status, setStatus] = useState<VoiceAssistantStatus>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ParseScreeningVoiceResponse | null>(null);

  useEffect(() => {
    speechRef.current = new MediaRecorderSpeechProvider();
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (aiLoading) {
      await refreshAiAvailability();
    }

    if (aiUnavailable) {
      setError(aiAvailabilityError ?? 'AI indisponibil — verificați configurarea din setările clinicii.');
      setStatus('error');
      return;
    }

    const speech = speechRef.current;
    if (!speech?.isSupported) {
      setError('Înregistrarea audio nu este suportată în acest browser.');
      setStatus('error');
      return;
    }

    setError(null);
    setLastResult(null);
    setRecordingSeconds(0);

    try {
      await speech.start();
      setStatus('recording');
      clearTimer();
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((seconds) => seconds + 1);
      }, 1000);
    } catch (startError) {
      setStatus('error');
      setError(startError instanceof Error ? startError.message : 'Nu s-a putut porni înregistrarea.');
    }
  }, [aiAvailabilityError, aiLoading, aiUnavailable, clearTimer, refreshAiAvailability]);

  const stopRecording = useCallback(async (): Promise<ParseScreeningVoiceResponse | null> => {
    const speech = speechRef.current;
    if (!speech) return null;

    clearTimer();
    setStatus('processing');
    setError(null);

    try {
      const { audioBlob } = await speech.stop();
      if (!audioBlob || audioBlob.size === 0) {
        setStatus('idle');
        setError('Nu s-a înregistrat audio. Reîncercați.');
        return null;
      }

      const audio_base64 = await blobToBase64(audioBlob);
      const result = await apiClient.parseScreeningVoice({
        audio_base64,
        mime: audioBlob.type || 'audio/webm',
      });

      setLastResult(result);
      setStatus('idle');
      void refreshAiAvailability();

      if (!result.transcript.trim()) {
        setError('Nu s-au detectat cuvinte în înregistrare. Vorbiți mai aproape de microfon.');
        return result;
      }

      if (!hasVoiceExtractableFields(result.extraction)) {
        setError('Transcriere reușită, dar nu s-au identificat date medicale. Completați manual.');
      }

      return result;
    } catch (stopError) {
      setStatus('error');
      if (stopError instanceof ApiClientError) {
        setError(stopError.message);
      } else {
        setError(stopError instanceof Error ? stopError.message : 'Procesarea audio a eșuat.');
      }
      void refreshAiAvailability();
      return null;
    }
  }, [clearTimer, refreshAiAvailability]);

  return {
    status,
    recordingSeconds,
    error: error ?? (aiUnavailable && !aiLoading ? aiAvailabilityError : null),
    lastResult,
    aiLoading,
    aiUnavailable,
    voiceReady,
    aiProvider: availability?.provider ?? null,
    refreshAiAvailability,
    isRecording: status === 'recording',
    isProcessing: status === 'processing',
    isSupported: speechRef.current?.isSupported ?? false,
    startRecording,
    stopRecording,
  };
}
