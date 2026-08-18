/**
 * Captures screenshot of the redesigned first page only.
 * Run: npx tsx apps/web/scripts/capture-first-page-redesign.ts
 * Requires: web dev server at http://127.0.0.1:5173
 */
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

import { DUMMY_PARTICIPANT_REPORT } from '../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://127.0.0.1:5173';
const outDir = resolve('apps/web/scripts/ui-screenshots');
mkdirSync(outDir, { recursive: true });

const screenshotPath = join(outDir, 'participant-report-first-page-branding.png');

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

  await page.waitForSelector('[data-testid="report-first-page"]', { timeout: 60_000 });
  await page.waitForFunction(() => document.body.dataset.reportPrintReady === 'true');
  await page.evaluate(() => document.fonts.ready);

  await page.locator('[data-testid="report-first-page"]').screenshot({
    path: screenshotPath,
  });

  console.log('SCREENSHOT=' + screenshotPath);
} finally {
  await browser.close();
}
