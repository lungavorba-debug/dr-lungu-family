import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { ParticipantReport } from '@medscreen/shared';

import { ClinicalReportView } from '../components/ClinicalReportView';
import '../styles/report-print.css';

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));

  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }

          image.onload = () => resolve();
          image.onerror = () => resolve();
        }),
    ),
  );
}

async function waitForNextPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Generate participant PDF entirely in the browser (no Playwright/API dependency). */
export async function generateClientReportPdf(input: {
  report: ParticipantReport;
  participantSignatureDataUrl?: string | null;
}): Promise<{ base64: string; byte_length: number }> {
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;background:#ffffff;width:210mm;';
  document.body.appendChild(host);

  const root = createRoot(host);

  try {
    root.render(
      <ClinicalReportView
        report={input.report}
        participantSignatureDataUrl={input.participantSignatureDataUrl}
        presentationMode="print"
      />,
    );

    await waitForNextPaint();
    await document.fonts.ready;
    await waitForImages(host);

    const reportElement = host.querySelector('#clinical-report');
    if (!(reportElement instanceof HTMLElement)) {
      throw new Error('Nu s-a putut renderiza raportul pentru PDF.');
    }

    const pageElements = Array.from(
      reportElement.querySelectorAll<HTMLElement>('.report-page-1, .report-page-2'),
    );
    const targets = pageElements.length > 0 ? pageElements : [reportElement];

    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    for (let index = 0; index < targets.length; index += 1) {
      const page = targets[index]!;
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: page.scrollWidth,
        height: page.scrollHeight,
        windowWidth: page.scrollWidth,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const renderWidth = A4_WIDTH_MM;
      const renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (index > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, renderWidth, Math.min(renderHeight, A4_HEIGHT_MM));
    }

    const dataUri = pdf.output('datauristring');
    const base64 = dataUri.includes(',') ? dataUri.split(',')[1]! : '';
    const byteLength = atob(base64).length;

    if (byteLength === 0) {
      throw new Error('PDF-ul generat este gol.');
    }

    return {
      base64,
      byte_length: byteLength,
    };
  } finally {
    root.unmount();
    host.remove();
  }
}
