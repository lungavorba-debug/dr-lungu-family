/** Stored participant report PDF helpers — HTML/Chromium generator (v5+). */

export const PDF_GENERATOR_VERSION = 15;

export interface StoredParticipantReportPdfMeta {
  generator_version?: number;
  base64: string;
}

export function pdfBytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return globalThis.btoa(binary);
}

export function base64ToPdfBytes(base64: string): Uint8Array {
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function isStoredParticipantReportPdfCompatible(pdf: StoredParticipantReportPdfMeta): boolean {
  if (pdf.generator_version !== PDF_GENERATOR_VERSION) {
    return false;
  }

  try {
    const bytes = base64ToPdfBytes(pdf.base64);
    const header = new TextDecoder('latin1').decode(bytes.subarray(0, 5));
    return bytes.length > 100 && header.startsWith('%PDF-');
  } catch {
    return false;
  }
}
