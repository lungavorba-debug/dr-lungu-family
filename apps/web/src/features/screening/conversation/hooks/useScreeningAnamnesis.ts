import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hasExtractableFields } from '@medscreen/shared';
import type { OperatorFieldReview, ScreeningExtractionFieldName, ScreeningExtractionResult } from '@medscreen/types';
import { useCampaign } from '../../../campaign/context/CampaignContext';
import { apiClient } from '../../../../shared/lib/api-client';
import type { ConversationAnamnesis } from '../../context/ScreeningSessionContext';
import { useScreeningSession } from '../../context/ScreeningSessionContext';
import { resolveConfidenceTier } from '../lib/confidence-merge';
import {
  buildClinicalSummary,
  getMissingAnamnesisTopics,
  mergeAnamnesisExtractionClinical,
  shouldShowCoverageChecklist,
  type AnamnesisFieldContradiction,
} from '../lib/clinical-intelligence';
import { getConversationProviders, initializeConversationProviders } from '../providers';
import { ConversationOrchestrator } from '../services/conversation-orchestrator';
import { anamnesisToFormState } from '../lib/anamnesis-storage';
import {
  calculateAnamnesisProgress,
  createEmptyAnamnesisForm,
  type AnamnesisFormField,
  type AnamnesisFormState,
} from '../types/anamnesis-form';
import type { AiConversationStatus, AiFieldHints, ConversationProviders, TranscriptSegment } from '../types/providers';

function buildAiFieldHints(
  extraction: ScreeningExtractionResult | null,
  operatorReviews: OperatorFieldReview[],
): AiFieldHints {
  if (!extraction) return {};

  const reviewMap = new Map(operatorReviews.map((review) => [review.field, review.accepted]));
  const hints: AiFieldHints = {};

  for (const [field, entry] of Object.entries(extraction.fields)) {
    if (!entry) continue;
    const tier = resolveConfidenceTier(entry.confidence);
    hints[field as AnamnesisFormField] = {
      aiFilled: true,
      lowConfidence: tier === 'low',
      mediumConfidence: tier === 'medium',
      confirmed: reviewMap.get(field as ScreeningExtractionFieldName) ?? null,
      confidence: entry.confidence,
      sourceSentence: entry.source_sentence ?? null,
    };
  }

  return hints;
}

function applyClinicalMerge(
  current: AnamnesisFormState,
  extraction: ScreeningExtractionResult,
  lockedFields: Set<AnamnesisFormField>,
) {
  return mergeAnamnesisExtractionClinical(current, extraction, lockedFields);
}

export function useScreeningAnamnesis(initialAnamnesis: ConversationAnamnesis | null) {
  const { activeCampaign } = useCampaign();
  const { setAiSessionId } = useScreeningSession();

  const [providers, setProviders] = useState<ConversationProviders>(() => getConversationProviders());
  const orchestratorRef = useRef<ConversationOrchestrator>(new ConversationOrchestrator(getConversationProviders()));
  const lockedFieldsRef = useRef<Set<AnamnesisFormField>>(new Set());
  const summaryLockedRef = useRef(false);

  const [form, setForm] = useState<AnamnesisFormState>(() =>
    initialAnamnesis ? anamnesisToFormState(initialAnamnesis) : createEmptyAnamnesisForm(),
  );
  const [lockedFields, setLockedFields] = useState<Set<AnamnesisFormField>>(new Set());
  const [contradictions, setContradictions] = useState<AnamnesisFieldContradiction[]>([]);
  const [aiStatus, setAiStatus] = useState<AiConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [assistantStarted, setAssistantStarted] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [aiMode, setAiMode] = useState<'mock' | 'production'>('mock');
  const [extraction, setExtraction] = useState<ScreeningExtractionResult | null>(null);
  const [operatorReviews, setOperatorReviews] = useState<OperatorFieldReview[]>([]);
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const formBeforeExtraction = useRef<AnamnesisFormState | null>(null);

  lockedFieldsRef.current = lockedFields;

  const processExtraction = useCallback((current: AnamnesisFormState, nextExtraction: ScreeningExtractionResult) => {
    formBeforeExtraction.current = { ...current };
    const merged = applyClinicalMerge(current, nextExtraction, lockedFieldsRef.current);
    return merged;
  }, []);

  useEffect(() => {
    let cancelled = false;

    void initializeConversationProviders(activeCampaign?.id ?? null).then((nextProviders) => {
      if (cancelled) return;
      setProviders(nextProviders);
      setAiMode(nextProviders.mode);
      setAiUnavailable(nextProviders.operational === false);
      const orchestrator = new ConversationOrchestrator(nextProviders);
      orchestrator.subscribeStatus(setAiStatus);
      orchestrator.subscribeExtraction((result) => {
        if (!hasExtractableFields(result.extraction)) {
          return;
        }
        setForm((current) => {
          const merged = processExtraction(current, result.extraction);
          setContradictions((existing) => {
            const fields = new Set(merged.contradictions.map((item) => item.field));
            const kept = existing.filter((item) => !fields.has(item.field));
            return [...kept, ...merged.contradictions];
          });
          return merged.form;
        });
        setExtraction(result.extraction);
        setTranscriptionError(null);
      });
      orchestratorRef.current = orchestrator;
      if (nextProviders.sessionId) {
        setAiSessionId(nextProviders.sessionId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [activeCampaign?.id, setAiSessionId, processExtraction]);

  useEffect(() => {
    return providers.transcript.subscribe(setTranscript);
  }, [providers]);

  useEffect(() => {
    if (aiStatus !== 'recording') return;
    const timerId = window.setInterval(() => setRecordingSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timerId);
  }, [aiStatus]);

  useEffect(() => {
    if (aiStatus !== 'completed' || summaryLockedRef.current || !extraction) {
      return;
    }
    setForm((current) => ({
      ...current,
      clinical_summary: current.clinical_summary.trim() ? current.clinical_summary : buildClinicalSummary(current),
    }));
  }, [aiStatus, extraction]);

  useEffect(() => {
    return () => orchestratorRef.current?.dispose();
  }, []);

  const progress = useMemo(() => calculateAnamnesisProgress(form), [form]);
  const missingTopics = useMemo(() => getMissingAnamnesisTopics(form), [form]);
  const showCoverageChecklist = useMemo(
    () =>
      shouldShowCoverageChecklist({
        assistantStarted,
        interviewActive: aiStatus === 'recording' || aiStatus === 'transcribing' || aiStatus === 'extracting',
        missingTopicsCount: missingTopics.length,
      }),
    [assistantStarted, aiStatus, missingTopics.length],
  );

  const fieldHints = useMemo(
    () => buildAiFieldHints(extraction, operatorReviews),
    [extraction, operatorReviews],
  );

  const applyExtractionResult = useCallback((nextExtraction: ScreeningExtractionResult) => {
    if (!hasExtractableFields(nextExtraction)) {
      return;
    }
    setForm((current) => {
      const merged = processExtraction(current, nextExtraction);
      setContradictions((existing) => {
        const fields = new Set(merged.contradictions.map((item) => item.field));
        const kept = existing.filter((item) => !fields.has(item.field));
        return [...kept, ...merged.contradictions];
      });
      return merged.form;
    });
    setExtraction(nextExtraction);
    setTranscriptionError(null);
  }, [processExtraction]);

  const updateField = useCallback((field: AnamnesisFormField, value: AnamnesisFormState[AnamnesisFormField]) => {
    setLockedFields((current) => {
      const next = new Set(current).add(field);
      lockedFieldsRef.current = next;
      return next;
    });
    if (field === 'clinical_summary') {
      summaryLockedRef.current = true;
    }
    setForm((current) => ({ ...current, [field]: value }));
  }, []);

  const regenerateClinicalSummary = useCallback(() => {
    setForm((current) => ({ ...current, clinical_summary: buildClinicalSummary(current) }));
    summaryLockedRef.current = false;
  }, []);

  const acceptContradiction = useCallback((field: AnamnesisFormField) => {
    setContradictions((current) => {
      const match = current.find((item) => item.field === field);
      if (match) {
        setForm((formState) => ({ ...formState, [field]: match.proposedRaw }));
        setLockedFields((locked) => {
          const next = new Set(locked).add(field);
          lockedFieldsRef.current = next;
          return next;
        });
      }
      return current.filter((item) => item.field !== field);
    });
  }, []);

  const rejectContradiction = useCallback((field: AnamnesisFormField) => {
    setContradictions((current) => current.filter((item) => item.field !== field));
    setLockedFields((locked) => {
      const next = new Set(locked).add(field);
      lockedFieldsRef.current = next;
      return next;
    });
  }, []);

  const startAssistant = useCallback(async () => {
    setRecordingError(null);
    try {
      await orchestratorRef.current!.startAssistant();
      setAssistantStarted(true);
      setRecordingSeconds(0);
    } catch (error) {
      setRecordingError(error instanceof Error ? error.message : 'Asistentul AI nu a putut fi pornit.');
      setAiUnavailable(true);
    }
  }, []);

  const startRecording = useCallback(async () => {
    setTranscriptionError(null);
    setRecordingError(null);
    setRecordingSeconds(0);
    try {
      if (!assistantStarted) {
        await orchestratorRef.current!.startAssistant();
        setAssistantStarted(true);
      }
      await orchestratorRef.current!.startRecording();
    } catch (error) {
      setRecordingError(error instanceof Error ? error.message : 'Nu s-a putut porni înregistrarea audio.');
    }
  }, [assistantStarted]);

  const pauseRecording = useCallback(async () => {
    await orchestratorRef.current!.pauseRecording();
  }, []);

  const resumeRecording = useCallback(async () => {
    await orchestratorRef.current!.resumeRecording();
  }, []);

  const stopRecording = useCallback(async () => {
    try {
      const outcome = await orchestratorRef.current!.stopRecording();
      if (outcome.emptyTranscript) {
        setTranscriptionError('Nu s-au detectat informații medicale.');
        return;
      }
      if (outcome.extraction) {
        applyExtractionResult(outcome.extraction.extraction);
      }
    } catch (error) {
      if (error instanceof Error && error.message === 'TRANSCRIPTION_FAILED') {
        setTranscriptionError('Transcrierea audio a eșuat. Reîncercați sau continuați manual.');
      }
    }
  }, [applyExtractionResult]);

  const retryTranscription = useCallback(async () => {
    setTranscriptionError(null);
    try {
      const outcome = await orchestratorRef.current!.retryTranscription();
      if (outcome.emptyTranscript) {
        setTranscriptionError('Nu s-au detectat informații medicale.');
        return;
      }
      if (outcome.extraction) {
        applyExtractionResult(outcome.extraction.extraction);
      }
    } catch {
      setTranscriptionError('Transcrierea audio a eșuat din nou. Continuați manual.');
    }
  }, [applyExtractionResult]);

  const toggleFieldReview = useCallback(
    async (field: ScreeningExtractionFieldName, accepted: boolean) => {
      const reviewedAt = new Date().toISOString();
      const snapshot = formBeforeExtraction.current;

      setOperatorReviews((current) => {
        const next = current.filter((review) => review.field !== field);
        next.push({ field, accepted, reviewed_at: reviewedAt });
        return next;
      });

      if (!accepted && snapshot && field in snapshot) {
        setForm((current) => ({
          ...current,
          [field]: snapshot[field as AnamnesisFormField],
        }));
        setLockedFields((current) => {
          const next = new Set(current);
          next.delete(field as AnamnesisFormField);
          lockedFieldsRef.current = next;
          return next;
        });
      }

      if (providers.sessionId) {
        const reviews = [
          ...operatorReviews.filter((review) => review.field !== field),
          { field, accepted, reviewed_at: reviewedAt },
        ];
        try {
          await apiClient.reviewScreeningExtraction(providers.sessionId, { reviews });
        } catch {
          // Review is persisted locally even if sync fails.
        }
      }
    },
    [operatorReviews, providers.sessionId],
  );

  const syncAiSessionBeforeContinue = useCallback(async () => {
    if (!providers.sessionId) return;
    try {
      await apiClient.syncTranscript(providers.sessionId, { segments: transcript });
      if (operatorReviews.length > 0) {
        await apiClient.reviewScreeningExtraction(providers.sessionId, { reviews: operatorReviews });
      }
    } catch {
      // Screening continues even if AI sync fails.
    }
  }, [operatorReviews, providers.sessionId, transcript]);

  return {
    form,
    updateField,
    aiStatus,
    transcript,
    assistantStarted,
    recordingSeconds,
    progress,
    missingTopics,
    showCoverageChecklist,
    contradictions,
    acceptContradiction,
    rejectContradiction,
    regenerateClinicalSummary,
    startAssistant,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    retryTranscription,
    isListening: aiStatus === 'recording',
    isPaused: aiStatus === 'paused',
    isTranscribing: aiStatus === 'transcribing',
    isExtracting: aiStatus === 'extracting',
    isProcessing: aiStatus === 'transcribing' || aiStatus === 'extracting',
    isCompleted: aiStatus === 'completed',
    aiMode,
    extraction,
    operatorReviews,
    fieldHints,
    toggleFieldReview,
    transcriptionError,
    recordingError,
    aiUnavailable,
    aiSessionId: providers.sessionId,
    syncAiSessionBeforeContinue,
  };
}
