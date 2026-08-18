import type { SpeechProvider, SpeechStartOptions, SpeechStopResult } from '../types/providers';

const RECORDER_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/aac',
  'audio/ogg;codecs=opus',
];

function resolveRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }

  for (const mimeType of RECORDER_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return mimeType;
    }
  }

  return undefined;
}

function resolveMicrophoneError(error: unknown): Error {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      return new Error(
        'Accesul la microfon a fost refuzat. Permiteți microfonul în setările browserului și reîncercați.',
      );
    }

    if (error.name === 'NotFoundError') {
      return new Error('Nu s-a găsit un microfon disponibil pe acest dispozitiv.');
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Nu s-a putut porni înregistrarea audio.');
}

export class MediaRecorderSpeechProvider implements SpeechProvider {
  readonly isSupported: boolean;
  readonly usesDemoCapture = false;

  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private recorderMimeType: string | undefined;
  private chunkHandler: ((blob: Blob) => void | Promise<void>) | null = null;
  private timesliceMs = 5000;

  constructor() {
    this.recorderMimeType = resolveRecorderMimeType();
    this.isSupported =
      typeof window !== 'undefined' &&
      Boolean(navigator.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';
  }

  async start(options?: SpeechStartOptions): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Înregistrarea audio nu este suportată în acest browser.');
    }

    this.chunks = [];
    this.chunkHandler = options?.onChunk ?? null;
    this.timesliceMs = options?.timesliceMs ?? 5000;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (error) {
      throw resolveMicrophoneError(error);
    }

    try {
      this.mediaRecorder = this.recorderMimeType
        ? new MediaRecorder(this.mediaStream, { mimeType: this.recorderMimeType })
        : new MediaRecorder(this.mediaStream);
    } catch (error) {
      this.cleanup();
      throw resolveMicrophoneError(error);
    }

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size <= 0) {
        return;
      }

      this.chunks.push(event.data);
      if (this.chunkHandler) {
        void this.chunkHandler(event.data);
      }
    };

    this.mediaRecorder.start(this.timesliceMs);
  }

  async pause(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state !== 'recording') {
      return;
    }
    recorder.pause();
  }

  async resume(): Promise<void> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state !== 'paused') {
      return;
    }
    recorder.resume();
  }

  async stop(): Promise<SpeechStopResult> {
    const recorder = this.mediaRecorder;
    if (!recorder || recorder.state === 'inactive') {
      this.cleanup();
      return { audioBlob: null };
    }

    const blob = await new Promise<Blob | null>((resolve) => {
      recorder.onstop = () => {
        const audioBlob = this.chunks.length
          ? new Blob(this.chunks, { type: recorder.mimeType || this.recorderMimeType || 'audio/webm' })
          : null;
        resolve(audioBlob);
      };
      recorder.stop();
    });

    this.cleanup();
    return { audioBlob: blob };
  }

  private cleanup(): void {
    this.mediaRecorder = null;
    this.chunks = [];
    this.chunkHandler = null;
    if (this.mediaStream) {
      for (const track of this.mediaStream.getTracks()) {
        track.stop();
      }
      this.mediaStream = null;
    }
  }
}
