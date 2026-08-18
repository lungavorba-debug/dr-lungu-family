import {
  hasExtractableFields,
  hasMeaningfulSpokenTranscript,
} from '@medscreen/shared';
import type {
  AiConversationStatus,
  ConversationProviders,
  ExtractionResult,
  StopRecordingOutcome,
} from '../types/providers';

const CHUNK_TIMESLICE_MS = 5000;
const EXTRACT_DEBOUNCE_MS = 1500;
const MIN_CHUNK_BYTES = 1024;
const EMPTY_TRANSCRIPT_MESSAGE = 'Nu s-au detectat informații medicale.';

export class ConversationOrchestrator {
  private status: AiConversationStatus = 'idle';
  private statusListeners = new Set<(status: AiConversationStatus) => void>();
  private extractionListeners = new Set<(result: ExtractionResult) => void>();
  private demoIntervalId: number | null = null;
  private lastExtraction: ExtractionResult | null = null;
  private lastAudioBlob: Blob | null = null;
  private extractTimeoutId: number | null = null;
  private chunkQueue: Promise<void> = Promise.resolve();
  private pendingChunks = 0;
  private isRecordingActive = false;
  private isPaused = false;
  private hasSuccessfulTranscription = false;

  constructor(private readonly providers: ConversationProviders) {}

  getStatus(): AiConversationStatus {
    return this.status;
  }

  getLastExtraction(): ExtractionResult | null {
    return this.lastExtraction;
  }

  subscribeStatus(listener: (status: AiConversationStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  subscribeExtraction(listener: (result: ExtractionResult) => void): () => void {
    this.extractionListeners.add(listener);
    return () => {
      this.extractionListeners.delete(listener);
    };
  }

  async startAssistant(): Promise<void> {
    this.providers.transcript.clear();
    this.hasSuccessfulTranscription = false;
    this.lastExtraction = null;
    this.providers.transcript.append({
      text: 'Asistentul AI este activ. Apăsați Start pentru a înregistra răspunsurile de screening.',
      source: 'system',
    });
    await this.persistTranscript();
    this.setStatus('ready');
  }

  async startRecording(): Promise<void> {
    if (this.status === 'transcribing' || this.status === 'extracting') {
      return;
    }

    await this.providers.speech.start({
      timesliceMs: CHUNK_TIMESLICE_MS,
      onChunk: (blob) => {
        void this.enqueueChunkProcessing(blob);
      },
    });

    this.isRecordingActive = true;
    this.setStatus('recording');

    if (this.providers.demoCaptureEnabled) {
      this.startDemoCapture();
    }
  }

  async pauseRecording(): Promise<void> {
    if (this.status !== 'recording') {
      return;
    }
    await this.providers.speech.pause?.();
    this.isPaused = true;
    this.setStatus('paused');
    this.stopDemoCapture();
  }

  async resumeRecording(): Promise<void> {
    if (this.status !== 'paused') {
      return;
    }
    await this.providers.speech.resume?.();
    this.isPaused = false;
    this.setStatus('recording');
    if (this.providers.demoCaptureEnabled) {
      this.startDemoCapture();
    }
  }

  async stopRecording(): Promise<StopRecordingOutcome> {
    if (this.status !== 'recording' && this.status !== 'paused') {
      return {
        extraction: this.lastExtraction,
        emptyTranscript: false,
      };
    }

    this.stopDemoCapture();
    this.isRecordingActive = false;
    const stopResult = await this.providers.speech.stop();
    this.lastAudioBlob = stopResult.audioBlob;

    if (stopResult.audioBlob && stopResult.audioBlob.size >= MIN_CHUNK_BYTES) {
      await this.enqueueChunkProcessing(stopResult.audioBlob);
    }

    await this.chunkQueue;
    return this.runFinalExtraction();
  }

  async retryTranscription(): Promise<StopRecordingOutcome> {
    if (!this.lastAudioBlob) {
      return { extraction: null, emptyTranscript: true };
    }
    await this.processAudioChunk(this.lastAudioBlob);
    return this.runFinalExtraction();
  }

  dispose(): void {
    this.stopDemoCapture();
    this.clearExtractTimeout();
    this.statusListeners.clear();
    this.extractionListeners.clear();
  }

  private async enqueueChunkProcessing(blob: Blob): Promise<void> {
    if (blob.size < MIN_CHUNK_BYTES) {
      return;
    }

    this.pendingChunks += 1;
    this.chunkQueue = this.chunkQueue.then(async () => {
      try {
        await this.processAudioChunk(blob);
      } finally {
        this.pendingChunks -= 1;
      }
    });

    await this.chunkQueue;
  }

  private async processAudioChunk(blob: Blob): Promise<void> {
    if (!this.providers.transcribeRecording) {
      return;
    }

    this.setStatus('transcribing');

    try {
      await this.providers.transcribeRecording(blob);
      await this.persistTranscript();

      const transcript = this.buildTranscriptText();
      if (transcript.trim()) {
        this.hasSuccessfulTranscription = true;
      }

      if (this.canRunExtraction()) {
        this.scheduleIncrementalExtraction();
      }
    } catch {
      this.providers.transcript.append({
        text: 'Transcrierea unui segment audio a eșuat. Înregistrarea continuă.',
        source: 'system',
      });
      await this.persistTranscript();
    } finally {
      this.restoreActiveRecordingStatus();
    }
  }

  private restoreActiveRecordingStatus(): void {
    if (!this.isRecordingActive) {
      return;
    }
    this.setStatus(this.isPaused ? 'paused' : 'recording');
  }

  private scheduleIncrementalExtraction(): void {
    if (!this.canRunExtraction()) {
      return;
    }

    this.clearExtractTimeout();
    this.extractTimeoutId = window.setTimeout(() => {
      void this.runIncrementalExtraction();
    }, EXTRACT_DEBOUNCE_MS);
  }

  private canRunExtraction(): boolean {
    if (!this.hasSuccessfulTranscription) {
      return false;
    }

    return hasMeaningfulSpokenTranscript(this.buildTranscriptText());
  }

  private async runIncrementalExtraction(): Promise<void> {
    const transcript = this.buildTranscriptText();
    if (!this.canRunExtraction() || !hasMeaningfulSpokenTranscript(transcript)) {
      return;
    }

    this.setStatus('extracting');
    try {
      const extracted = await this.providers.extraction.extract(transcript);
      if (!hasExtractableFields(extracted.extraction)) {
        return;
      }
      this.lastExtraction = extracted;
      this.notifyExtraction(extracted);
      await this.persistTranscript();
    } catch {
      // Extraction failure is non-blocking; operator can continue manually.
    } finally {
      if (this.isRecordingActive) {
        this.restoreActiveRecordingStatus();
      }
    }
  }

  private async runFinalExtraction(): Promise<StopRecordingOutcome> {
    this.clearExtractTimeout();
    await this.chunkQueue;

    const transcript = this.buildTranscriptText();
    if (!this.canRunExtraction() || !hasMeaningfulSpokenTranscript(transcript)) {
      this.providers.transcript.append({
        text: EMPTY_TRANSCRIPT_MESSAGE,
        source: 'system',
      });
      await this.persistTranscript();
      this.setStatus('completed');
      return { extraction: null, emptyTranscript: true };
    }

    this.setStatus('extracting');
    try {
      const extracted = await this.providers.extraction.extract(transcript);
      if (hasExtractableFields(extracted.extraction)) {
        this.lastExtraction = extracted;
        this.notifyExtraction(extracted);
      }
    } catch {
      this.providers.transcript.append({
        text: 'Extragerea automată a eșuat. Verificați manual câmpurile.',
        source: 'system',
      });
    }

    this.providers.transcript.append({
      text: 'Screening-ul a fost procesat. Verificați răspunsurile completate automat.',
      source: 'system',
    });
    await this.persistTranscript();
    this.setStatus('completed');
    return { extraction: this.lastExtraction, emptyTranscript: false };
  }

  private buildTranscriptText(includeSystem = false): string {
    return this.providers.transcript
      .getSegments()
      .filter((segment) => includeSystem || segment.source !== 'system')
      .map((segment) => segment.text)
      .join(' ');
  }

  private async persistTranscript(): Promise<void> {
    if (!this.providers.syncTranscript) {
      return;
    }
    try {
      await this.providers.syncTranscript(this.providers.transcript.getSegments());
    } catch {
      // Transcript remains local; screening can continue manually.
    }
  }

  private startDemoCapture(): void {
    if (!this.providers.demoCaptureEnabled) {
      return;
    }

    this.stopDemoCapture();

    const demoLines = [
      'Medic: Aveți hipertensiune cunoscută?',
      'Pacient: Nu, tensiunea e ok.',
      'Medic: Fumați?',
      'Pacient: Nu, nu fumez.',
      'Medic: Aveți diabet?',
      'Pacient: Nu am diabet.',
      'Medic: Urmați vreun tratament?',
      'Pacient: Nu.',
    ];

    let index = 0;
    this.demoIntervalId = window.setInterval(() => {
      if (this.status !== 'recording') return;
      const line = demoLines[index % demoLines.length];
      index += 1;
      this.providers.transcript.append({
        text: line,
        source: line.startsWith('Medic:') ? 'operator' : 'participant',
      });
      this.hasSuccessfulTranscription = true;
      void this.persistTranscript();
      this.scheduleIncrementalExtraction();
    }, 3500);
  }

  private stopDemoCapture(): void {
    if (this.demoIntervalId !== null) {
      window.clearInterval(this.demoIntervalId);
      this.demoIntervalId = null;
    }
  }

  private clearExtractTimeout(): void {
    if (this.extractTimeoutId !== null) {
      window.clearTimeout(this.extractTimeoutId);
      this.extractTimeoutId = null;
    }
  }

  private notifyExtraction(result: ExtractionResult): void {
    if (!hasExtractableFields(result.extraction)) {
      return;
    }

    for (const listener of this.extractionListeners) {
      listener(result);
    }
  }

  private setStatus(status: AiConversationStatus): void {
    this.status = status;
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }
}

export function extractionToAnamnesisFields(extraction: ExtractionResult) {
  return extraction.fields;
}
