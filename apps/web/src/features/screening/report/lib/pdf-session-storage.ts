import {
  PDF_GENERATOR_VERSION,
  isStoredParticipantReportPdfCompatible,
  type StoredParticipantReportPdfMeta,
} from '@medscreen/shared';

export interface StoredScreeningPdf {
  filename: string;
  mime_type: 'application/pdf';
  base64: string;
  generated_at: string;
  byte_length: number;
  screening_id: string;
  generator_version: number;
}

const STORAGE_PREFIX = 'medscreen_screening_pdf:';

export function persistScreeningPdf(screeningId: string, pdf: StoredScreeningPdf): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}${screeningId}`, JSON.stringify(pdf));
}

export function loadScreeningPdf(screeningId: string): StoredScreeningPdf | null {
  const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${screeningId}`);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as StoredScreeningPdf;

    if (!isStoredParticipantReportPdfCompatible(parsed)) {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${screeningId}`);
      return null;
    }

    return parsed;
  } catch {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${screeningId}`);
    return null;
  }
}

export function clearScreeningPdf(screeningId: string): void {
  sessionStorage.removeItem(`${STORAGE_PREFIX}${screeningId}`);
}

export function storedPdfToBlob(pdf: StoredScreeningPdf): Blob {
  const binary = globalThis.atob(pdf.base64);

  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: pdf.mime_type });
}

export function downloadStoredPdf(pdf: StoredScreeningPdf): void {
  const blob = storedPdfToBlob(pdf);

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');

  anchor.href = url;

  anchor.download = pdf.filename;

  anchor.click();

  URL.revokeObjectURL(url);
}

function isMobilePrintDevice(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function printPdfFromWindow(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const printWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      settle(() => reject(new Error('Nu s-a putut deschide PDF-ul pentru tipărire.')));
      return;
    }

    printWindow.document.title = filename;

    const triggerPrint = () => {
      window.setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
          printWindow.addEventListener('afterprint', () => settle(() => resolve()), { once: true });
          window.setTimeout(() => settle(() => resolve()), 120_000);
        } catch (err) {
          settle(() =>
            reject(err instanceof Error ? err : new Error('Tipărirea a eșuat.')),
          );
        }
      }, 600);
    };

    printWindow.onload = triggerPrint;
    window.setTimeout(triggerPrint, 1_500);
  });
}

function printPdfFromIframe(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');

    iframe.setAttribute('title', filename);
    iframe.style.cssText =
      'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none;';

    let settled = false;

    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      iframe.remove();
      fn();
    };

    iframe.onload = () => {
      window.setTimeout(() => {
        try {
          const win = iframe.contentWindow;

          if (!win) {
            settle(() => reject(new Error('Nu s-a putut deschide PDF-ul pentru tipărire.')));
            return;
          }

          win.focus();
          win.print();
          win.addEventListener('afterprint', () => settle(() => resolve()), { once: true });
          window.setTimeout(() => settle(() => resolve()), 120_000);
        } catch (err) {
          settle(() =>
            reject(err instanceof Error ? err : new Error('Tipărirea a eșuat.')),
          );
        }
      }, 500);
    };

    iframe.onerror = () =>
      settle(() => reject(new Error('Nu s-a putut încărca PDF-ul pentru tipărire.')));

    document.body.appendChild(iframe);
    iframe.src = url;
  });
}

/** Opens the browser print dialog for a stored screening PDF. */
export function printStoredPdf(pdf: StoredScreeningPdf): Promise<void> {
  const blob = storedPdfToBlob(pdf);
  const url = URL.createObjectURL(blob);

  const cleanup = () => {
    URL.revokeObjectURL(url);
  };

  const printPromise = isMobilePrintDevice()
    ? printPdfFromWindow(url, pdf.filename)
    : printPdfFromIframe(url, pdf.filename);

  return printPromise.finally(cleanup);
}

export function isCompatibleStoredScreeningPdf(
  pdf: StoredParticipantReportPdfMeta | null | undefined,
): pdf is StoredScreeningPdf {
  return pdf != null && isStoredParticipantReportPdfCompatible(pdf);
}

export { PDF_GENERATOR_VERSION };
