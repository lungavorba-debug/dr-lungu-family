import { PDFDocument } from 'pdf-lib';

/** Uniform A4 page margins for participant report PDFs. */
export const REPORT_PDF_PAGE_MARGIN_MM = 10;

export const REPORT_PDF_MARGINS = {
  top: `${REPORT_PDF_PAGE_MARGIN_MM}mm`,
  right: `${REPORT_PDF_PAGE_MARGIN_MM}mm`,
  bottom: `${REPORT_PDF_PAGE_MARGIN_MM}mm`,
  left: `${REPORT_PDF_PAGE_MARGIN_MM}mm`,
} as const;

/** Printable content box inside A4 with 10mm margins (96 CSS px/in). */
export const REPORT_PDF_CONTENT_WIDTH_PX = Math.floor(
  ((210 - REPORT_PDF_PAGE_MARGIN_MM * 2) * 96) / 25.4,
);

export const REPORT_PDF_CONTENT_HEIGHT_PX = Math.floor(
  ((297 - REPORT_PDF_PAGE_MARGIN_MM * 2) * 96) / 25.4,
);

export const REPORT_PDF_VIEWPORT = {
  width: REPORT_PDF_CONTENT_WIDTH_PX,
  height: REPORT_PDF_CONTENT_HEIGHT_PX,
} as const;

export async function mergePdfDocuments(buffers: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();

  for (const buffer of buffers) {
    const document = await PDFDocument.load(buffer);
    const pages = await merged.copyPages(document, document.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }

  return merged.save();
}
