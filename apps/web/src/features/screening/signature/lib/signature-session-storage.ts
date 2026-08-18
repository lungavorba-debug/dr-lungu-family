export interface StoredParticipantSignature {
  image_base64: string;
  mime_type: 'image/png';
  signed_at: string;
  screening_id: string;
  participant_name: string;
}

const STORAGE_PREFIX = 'medscreen_screening_signature:';

export function persistScreeningSignature(
  screeningId: string,
  signature: StoredParticipantSignature,
): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}${screeningId}`, JSON.stringify(signature));
}

export function loadScreeningSignature(screeningId: string): StoredParticipantSignature | null {
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${screeningId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredParticipantSignature;
  } catch {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${screeningId}`);
    return null;
  }
}

export function clearScreeningSignature(screeningId: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${screeningId}`);
}

export function signatureFromCanvas(
  canvas: HTMLCanvasElement,
  screeningId: string,
  participantName: string,
): StoredParticipantSignature {
  const dataUrl = canvas.toDataURL('image/png', 1);
  const image_base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  return {
    image_base64,
    mime_type: 'image/png',
    signed_at: new Date().toISOString(),
    screening_id: screeningId,
    participant_name: participantName,
  };
}

export function signatureToDataUrl(signature: StoredParticipantSignature): string {
  return `data:${signature.mime_type};base64,${signature.image_base64}`;
}

export function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const context = canvas.getContext('2d');
  if (!context) return true;
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
      return false;
    }
  }
  return true;
}
