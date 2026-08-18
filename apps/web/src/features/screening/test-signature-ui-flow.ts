import {
  clearScreeningSignature,
  loadScreeningSignature,
  persistScreeningSignature,
  signatureToDataUrl,
} from './signature/lib/signature-session-storage';

function assert(name: string, ok: boolean, detail = '') {
  console.log(`UI: ${name}`, ok ? 'PASS' : 'FAIL', detail);
  if (!ok) {
    process.exitCode = 1;
  }
}

class MemorySessionStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

const memoryStorage = new MemorySessionStorage();
(globalThis as { sessionStorage: Storage }).sessionStorage =
  memoryStorage as unknown as Storage;

const screeningId = 'dddddddd-eeee-ffff-0000-111111111111';
const signature = {
  image_base64: 'abc123',
  mime_type: 'image/png' as const,
  signed_at: '2026-07-31T12:00:00.000Z',
  screening_id: screeningId,
  participant_name: 'Maria Test',
};

persistScreeningSignature(screeningId, signature);
const loaded = loadScreeningSignature(screeningId);

assert('signature round-trip name', loaded?.participant_name === 'Maria Test');
assert('signature round-trip id', loaded?.screening_id === screeningId);
assert('signature data URL', signatureToDataUrl(signature).includes('abc123'));

clearScreeningSignature(screeningId);
assert('signature cleared', loadScreeningSignature(screeningId) === null);

if (process.exitCode === 1) {
  throw new Error('Signature UI tests failed');
}

console.log('Signature UI tests completed successfully.');
