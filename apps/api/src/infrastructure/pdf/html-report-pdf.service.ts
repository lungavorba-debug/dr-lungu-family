import { chromium, type Browser, type Page } from 'playwright';

import type { ParticipantReport } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { ensurePlaywrightChromiumReady } from './ensure-playwright-chromium';
import { normalizeParticipantSignatureDataUrl } from './normalize-participant-signature';
import {
  REPORT_PDF_CONTENT_HEIGHT_PX,
  REPORT_PDF_VIEWPORT,
  mergePdfDocuments,
} from './merge-pdf-documents';

const PDF_UNAVAILABLE_MESSAGE =
  'Generarea PDF-ului nu este disponibilă momentan. Încercați din nou în câteva secunde.';

export interface HtmlReportPdfInput {
  webAppUrl: string;
  report: ParticipantReport;
  participantSignatureDataUrl?: string | null;
}

/** Printable A4 height in CSS px (96dpi) minus 10mm top/bottom @page margins. */
function printableHeightPx(): number {
  return REPORT_PDF_CONTENT_HEIGHT_PX;
}

async function renderReportPrintPage(page: Page, input: HtmlReportPdfInput): Promise<void> {
  const signatureDataUrl = normalizeParticipantSignatureDataUrl(input.participantSignatureDataUrl);
  const baseUrl = input.webAppUrl.replace(/\/$/, '');

  await page.setViewportSize(REPORT_PDF_VIEWPORT);

  await page.addInitScript((data) => {
    (globalThis as { __REPORT_PRINT_DATA__?: typeof data }).__REPORT_PRINT_DATA__ = data;
  }, {
    report: input.report,
    participantSignatureDataUrl: signatureDataUrl,
  });

  await page.goto(`${baseUrl}/report-print`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });

  const emptyState = await page.$('[data-testid="report-print-empty"]');
  if (emptyState) {
    throw new AppError(
      502,
      'PDF_RENDER_FAILED',
      'Pagina de printare nu a primit datele raportului.',
    );
  }

  await page.waitForSelector('[data-testid="clinical-report"]', { timeout: 60_000 });
  await page.waitForSelector('body[data-report-print-ready="true"]', { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
}

async function isolateReportPage(page: Page, target: '1' | '2'): Promise<void> {
  await page.evaluate((pageNumber) => {
    const page1 = document.querySelector('[data-testid="report-first-page"]');
    const page2 = document.querySelector('[data-testid="report-second-page"]');
    if (!page1 || !page2) {
      throw new Error('Report page containers missing.');
    }

    if (pageNumber === '1') {
      page2.remove();
    } else {
      page1.remove();
    }

    const article = document.getElementById('clinical-report');
    if (article) {
      article.style.margin = '0';
      article.style.padding = '0';
      article.style.width = '100%';
      article.style.maxWidth = 'none';
    }

    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.width = '100%';
  }, target);
}

async function readActivePageHeight(page: Page): Promise<number> {
  return page.evaluate(() => {
    const active =
      document.querySelector<HTMLElement>('[data-testid="report-first-page"]') ??
      document.querySelector<HTMLElement>('[data-testid="report-second-page"]');
    return active?.scrollHeight ?? 0;
  });
}

async function pdfForActivePage(page: Page): Promise<Uint8Array> {
  const contentHeight = await readActivePageHeight(page);
  const maxHeight = printableHeightPx();
  const scale =
    contentHeight > maxHeight * 1.01 ? Math.min(1, maxHeight / contentHeight) : 1;

  if (scale < 1) {
    console.log(
      `[pdf] Scaling page to ${(scale * 100).toFixed(1)}% (${contentHeight}px → ${maxHeight}px printable)`,
    );
  }

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    scale,
  });

  if (!pdfBuffer?.length) {
    throw new AppError(502, 'PDF_RENDER_FAILED', 'Motorul PDF a returnat un fișier gol.');
  }

  return new Uint8Array(pdfBuffer);
}

async function generateLogicalPagePdf(
  browser: Browser,
  input: HtmlReportPdfInput,
  logicalPage: '1' | '2',
): Promise<Uint8Array> {
  const page = await browser.newPage();

  try {
    await renderReportPrintPage(page, input);
    await isolateReportPage(page, logicalPage);
    return await pdfForActivePage(page);
  } finally {
    await page.close();
  }
}

export class HtmlReportPdfService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        await ensurePlaywrightChromiumReady();
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
      } catch (error) {
        console.error('[pdf] Playwright Chromium launch failed:', error);
        throw new AppError(503, 'PDF_SERVICE_UNAVAILABLE', PDF_UNAVAILABLE_MESSAGE);
      }
    }

    return this.browser;
  }

  async generatePdf(input: HtmlReportPdfInput): Promise<Uint8Array> {
    const reportId = input.report?.metadata?.report_id ?? '(unknown)';
    console.log(
      `[pdf] Generating 2-page vector PDF for ${reportId} via ${input.webAppUrl.replace(/\/$/, '')}/report-print`,
    );

    let browser: Browser;
    try {
      browser = await this.getBrowser();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[pdf] Browser bootstrap error:', error);
      throw new AppError(503, 'PDF_SERVICE_UNAVAILABLE', 'Nu s-a putut porni motorul PDF.');
    }

    try {
      const [pageOnePdf, pageTwoPdf] = await Promise.all([
        generateLogicalPagePdf(browser, input, '1'),
        generateLogicalPagePdf(browser, input, '2'),
      ]);

      const merged = await mergePdfDocuments([pageOnePdf, pageTwoPdf]);
      console.log(`[pdf] Generated ${merged.byteLength} bytes (2 pages merged) for report ${reportId}`);
      return merged;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[pdf] Participant report PDF generation failed:', error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      const message =
        error instanceof Error ? error.message : 'Generarea PDF-ului participant a eșuat.';

      if (message.includes('Executable doesn') || message.includes('browserType.launch')) {
        throw new AppError(503, 'PDF_SERVICE_UNAVAILABLE', PDF_UNAVAILABLE_MESSAGE);
      }

      if (message.includes('Timeout') || message.includes('timeout')) {
        throw new AppError(
          504,
          'PDF_RENDER_TIMEOUT',
          'Pagina de printare nu a răspuns la timp. Verifică că frontend-ul rulează.',
        );
      }

      throw new AppError(502, 'PDF_RENDER_FAILED', message);
    }
  }

  async dispose(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export const htmlReportPdfService = new HtmlReportPdfService();
