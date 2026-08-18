import { chromium, type Browser } from 'playwright';

import type { ParticipantReport } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import { normalizeParticipantSignatureDataUrl } from './normalize-participant-signature';

export interface HtmlReportPdfInput {
  webAppUrl: string;
  report: ParticipantReport;
  participantSignatureDataUrl?: string | null;
}

export class HtmlReportPdfService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      try {
        this.browser = await chromium.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
      } catch (error) {
        console.error('[pdf] Playwright Chromium launch failed:', error);
        throw new AppError(
          503,
          'PDF_SERVICE_UNAVAILABLE',
          'Motorul PDF (Playwright Chromium) nu este disponibil. Rulează: npx playwright install chromium',
        );
      }
    }

    return this.browser;
  }

  async generatePdf(input: HtmlReportPdfInput): Promise<Uint8Array> {
    const signatureDataUrl = normalizeParticipantSignatureDataUrl(input.participantSignatureDataUrl);
    const baseUrl = input.webAppUrl.replace(/\/$/, '');
    const reportId = input.report?.metadata?.report_id ?? '(unknown)';

    console.log(`[pdf] Generating participant report PDF for ${reportId} via ${baseUrl}/report-print`);

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

    const page = await browser.newPage();

    try {
      page.on('pageerror', (error) => {
        console.error('[pdf] Report print page error:', error);
      });

      page.on('console', (message) => {
        if (message.type() === 'error') {
          console.error('[pdf] Report print console:', message.text());
        }
      });

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
      await page.waitForTimeout(750);
      await page.emulateMedia({ media: 'print' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      if (!pdfBuffer?.length) {
        throw new AppError(502, 'PDF_RENDER_FAILED', 'Motorul PDF a returnat un fișier gol.');
      }

      console.log(`[pdf] Generated ${pdfBuffer.length} bytes for report ${reportId}`);
      return new Uint8Array(pdfBuffer);
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
        throw new AppError(
          503,
          'PDF_SERVICE_UNAVAILABLE',
          'Playwright Chromium lipsește. Rulează: npx playwright install chromium',
        );
      }

      if (message.includes('Timeout') || message.includes('timeout')) {
        throw new AppError(
          504,
          'PDF_RENDER_TIMEOUT',
          `Pagina de printare nu a răspuns la timp (${baseUrl}). Verifică că frontend-ul rulează.`,
        );
      }

      throw new AppError(502, 'PDF_RENDER_FAILED', message);
    } finally {
      await page.close();
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
