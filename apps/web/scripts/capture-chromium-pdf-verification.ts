/**
 * Captures HTML + Chromium PDF screenshots for participant report parity verification.
 * Run: npx tsx apps/web/scripts/capture-chromium-pdf-verification.ts
 * Requires: web dev server at http://127.0.0.1:5173
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

import { DUMMY_PARTICIPANT_REPORT } from '../../../packages/shared/src/report/fixtures/dummy-participant-report.ts';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://127.0.0.1:5173';
const outDir = resolve('apps/web/scripts/ui-screenshots');
mkdirSync(outDir, { recursive: true });

const htmlScreenshotPath = join(outDir, 'participant-report-chromium-html.png');
const pdfPath = join(outDir, 'participant-report-chromium.pdf');
const pdfScreenshotPath = join(outDir, 'participant-report-chromium-pdf.png');

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

  await page.locator('#clinical-report').screenshot({
    path: htmlScreenshotPath,
    fullPage: true,
  });

  await page.emulateMedia({ media: 'print' });
  const pdfBytes = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  writeFileSync(pdfPath, pdfBytes);

  const pageMatches = new TextDecoder('latin1').decode(pdfBytes).match(/\/Type\s*\/Page\b/g);
  const pageCount = pageMatches?.length ?? 0;

  const viewerHtmlPath = join(outDir, 'participant-report-chromium-viewer.html');
  writeFileSync(
    viewerHtmlPath,
    `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <style>
    body { margin: 0; background: #e2e8f0; }
    #pages { display: flex; flex-direction: column; gap: 16px; padding: 16px; align-items: center; }
    canvas { background: white; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15); }
  </style>
  <script src="./pdf.min.js"></script>
</head>
<body>
  <div id="pages"></div>
  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc = './pdf.worker.min.js';
    pdfjsLib.getDocument('participant-report-chromium.pdf').promise.then(async (pdf) => {
      const container = document.getElementById('pages');
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.35 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        container.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
      document.body.dataset.pdfRenderReady = 'true';
    });
  </script>
</body>
</html>`,
  );

  const pdfPage = await browser.newPage({ viewport: { width: 980, height: 1400 } });
  await pdfPage.goto(`file:///${viewerHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'domcontentloaded' });
  await pdfPage.waitForFunction("document.body.dataset.pdfRenderReady === 'true'", { timeout: 60_000 });
  await pdfPage.locator('#pages').screenshot({ path: pdfScreenshotPath });
  await pdfPage.close();

  console.log(
    JSON.stringify(
      {
        htmlScreenshot: htmlScreenshotPath,
        pdfFile: pdfPath,
        pdfScreenshot: pdfScreenshotPath,
        pdfPageCount: pageCount,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
