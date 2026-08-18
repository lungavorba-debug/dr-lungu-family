import type { SpeechProvider, SpeechStartOptions, SpeechStopResult } from '../types/providers';

export class MockSpeechProvider implements SpeechProvider {
  readonly isSupported = true;
  readonly usesDemoCapture = true;

  private active = false;
  private paused = false;
  async start(options?: SpeechStartOptions): Promise<void> {
    this.active = true;
    this.paused = false;
    void options?.onChunk;
  }

  async pause(): Promise<void> {
    if (this.active) {
      this.paused = true;
    }
  }

  async resume(): Promise<void> {
    if (this.active && this.paused) {
      this.paused = false;
    }
  }

  async stop(): Promise<SpeechStopResult> {
    this.active = false;
    this.paused = false;
    return { audioBlob: null };
  }
}
