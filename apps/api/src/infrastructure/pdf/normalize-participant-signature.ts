/**
 * Normalizes optional canvas signature payloads for HTML/PDF rendering.
 * Invalid or empty values become null — never throw.
 */
export function normalizeParticipantSignatureDataUrl(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:')) {
    const match = trimmed.match(/^data:image\/(png|jpe?g|webp);base64,(.*)$/i);
    if (!match) {
      return null;
    }

    const mime = match[1].toLowerCase() === 'jpg' ? 'jpeg' : match[1].toLowerCase();
    const base64 = match[2].replace(/\s/g, '');
    if (!base64 || !isValidBase64(base64)) {
      return null;
    }

    return `data:image/${mime};base64,${base64}`;
  }

  const rawBase64 = trimmed.replace(/\s/g, '');
  if (!isValidBase64(rawBase64)) {
    return null;
  }

  return `data:image/png;base64,${rawBase64}`;
}

function isValidBase64(value: string): boolean {
  if (!value || value.length % 4 !== 0) {
    return false;
  }

  try {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length > 0;
  } catch {
    return false;
  }
}
