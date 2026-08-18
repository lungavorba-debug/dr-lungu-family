import type { TranscriptProvider, TranscriptSegment } from '../types/providers';

export class MockTranscriptProvider implements TranscriptProvider {
  private segments: TranscriptSegment[] = [];
  private listeners = new Set<(segments: TranscriptSegment[]) => void>();

  subscribe(listener: (segments: TranscriptSegment[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.segments]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSegments(): TranscriptSegment[] {
    return [...this.segments];
  }

  append(segment: Omit<TranscriptSegment, 'id' | 'timestamp'>): void {
    const next: TranscriptSegment = {
      ...segment,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    this.segments = [...this.segments, next];
    this.emit();
  }

  clear(): void {
    this.segments = [];
    this.emit();
  }

  private emit(): void {
    const snapshot = [...this.segments];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}
