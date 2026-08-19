/**
 * Verifies browser-side PDF generation (jsPDF + html2canvas) — no Playwright Chromium on API.
 * Run: npx tsx apps/web/scripts/test-client-report-pdf.ts
 * Requires: web dev server at http://127.0.0.1:5173
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

import { DUMMY_PARTICIPANT_REPORT } from '../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://127.0.0.1:5173';
const outDir = resolve('apps/web/scripts/ui-screenshots');
mkdirSync(outDir, { recursive: true });

const headerScreenshotPath = join(outDir, 'client-pdf-header-check.png');
const pdfPath = join(outDir, 'client-pdf-test-output.pdf');

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 920, height: 1400 } });

try {
  await page.addInitScript((data) => {
    window.__REPORT_PRINT_DATA__ = data;
  }, {
    report: DUMMY_PARTICIPANT_REPORT,
    participantSignatureDataUrl: null,
  });

  await page.goto(`${WEB_APP_URL.replace(/\/$/, '')}/report-print`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });

  await page.waitForSelector('[data-testid="clinical-report"]', { timeout: 60_000 });
  await page.waitForFunction(() => document.body.dataset.reportPrintReady === 'true');
  await page.evaluate(() => document.fonts.ready);

  await page.locator('.report-header-top').screenshot({ path: headerScreenshotPath });

  const pdfResult = await page.evaluate(async () => {
    const payload = window.__REPORT_PRINT_DATA__;
    if (!payload?.report) {
      throw new Error('Missing report print payload');
    }

    const mod = await import('/src/features/screening/report/lib/generate-client-report-pdf.tsx');
    return mod.generateClientReportPdf({
      report: payload.report,
      participantSignatureDataUrl: payload.participantSignatureDataUrl ?? null,
    });
  });

  if (!pdfResult.base64 || pdfResult.byte_length < 1000) {
    throw new Error(`Client PDF generation failed or produced empty output (${pdfResult.byte_length} bytes).`);
  }

  writeFileSync(pdfPath, Buffer.from(pdfResult.base64, 'base64'));

  const titleBox = await page.locator('.report-header-title').boundingBox();
  const headerBox = await page.locator('.report-header-top').boundingBox();

  if (!titleBox || !headerBox) {
    throw new Error('Could not measure header layout.');
  }

  const titleCenterX = titleBox.x + titleBox.width / 2;
  const headerCenterX = headerBox.x + headerBox.width / 2;
  const centerOffsetPx = Math.abs(titleCenterX - headerCenterX);

  console.log(
    JSON.stringify(
      {
        ok: true,
        pdfBytes: pdfResult.byte_length,
        pdfFile: pdfPath,
        headerScreenshot: headerScreenshotPath,
        titleCenterOffsetPx: Math.round(centerOffsetPx * 10) / 10,
        titleCentered: centerOffsetPx <= 12,
      },
      null,
      2,
    ),
  );

  if (centerOffsetPx > 12) {
    throw new Error(`Title block is off-center by ${centerOffsetPx.toFixed(1)}px (max 12px).`);
  }
} finally {
  await browser.close();
}
