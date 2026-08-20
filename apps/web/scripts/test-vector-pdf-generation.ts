/**
 * End-to-end vector PDF verification (Playwright 2-page merge — same as production API).
 * Run: npm run test:vector-pdf
 * Requires: web dev server at http://127.0.0.1:5173
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';
import { chromium, type Browser, type Page } from 'playwright';

import { DUMMY_PARTICIPANT_REPORT_GESTATIONAL } from '../../../packages/shared/src/report/fixtures/dummy-participant-report-gestational';

const WEB_APP_URL = process.env.WEB_APP_URL ?? 'http://127.0.0.1:5173';
const outDir = resolve('apps/web/scripts/ui-screenshots');
mkdirSync(outDir, { recursive: true });

const pdfPath = join(outDir, 'vector-pdf-test-output.pdf');
const partnersScreenshotPath = join(outDir, 'vector-pdf-partners-300dpi.png');
const page1ScreenshotPath = join(outDir, 'vector-pdf-page-1-print-sim.png');
const page2ScreenshotPath = join(outDir, 'vector-pdf-page-2-print-sim.png');

const PDF_MARGINS = { top: '0', right: '0', bottom: '0', left: '0' };
const VIEWPORT = { width: 718, height: 1047 };

async function mergePdfDocuments(buffers: Uint8Array[]): Promise<Uint8Array> {
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

async function loadReportPrintPage(page: Page): Promise<void> {
  await page.setViewportSize(VIEWPORT);
  await page.addInitScript((data) => {
    window.__REPORT_PRINT_DATA__ = data;
  }, {
    report: DUMMY_PARTICIPANT_REPORT_GESTATIONAL,
    participantSignatureDataUrl: null,
  });

  await page.goto(`${WEB_APP_URL.replace(/\/$/, '')}/report-print`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });

  await page.waitForSelector('[data-testid="clinical-report"]', { timeout: 60_000 });
  await page.waitForSelector('body[data-report-print-ready="true"]', { timeout: 30_000 });
  await page.evaluate(() => document.fonts.ready);
  await page.emulateMedia({ media: 'print' });
}

async function isolateReportPage(page: Page, target: '1' | '2'): Promise<void> {
  await page.evaluate((pageNumber) => {
    const page1 = document.querySelector('[data-testid="report-first-page"]');
    const page2 = document.querySelector('[data-testid="report-second-page"]');
    if (!page1 || !page2) throw new Error('Report page containers missing.');
    if (pageNumber === '1') page2.remove();
    else page1.remove();
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

function analyzePdfVectorQuality(extractedPages: { text: string }[], extractedText: string) {
  const normalizedText = extractedText.replace(/\s+/g, ' ').trim();
  return {
    pageCount: extractedPages.length,
    extractedTextLength: normalizedText.length,
    hasReportText: /SCREENING/i.test(normalizedText) && /CARDIOVASCULAR/i.test(normalizedText),
    hasGestationalCase: /Gesta/i.test(normalizedText),
    hasOrganizers: /ORGANIZATORI|Organizator/i.test(normalizedText),
    hasDisclaimerLast: /IMPORTANT/i.test(normalizedText),
    isVector: normalizedText.length >= 500,
    textPreview: normalizedText.slice(0, 280),
  };
}

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

try {
  const pageOneTab = await browser.newPage();
  await loadReportPrintPage(pageOneTab);
  await isolateReportPage(pageOneTab, '1');
  const partnersBox = await pageOneTab.locator('.report-header-partners .grid').boundingBox();
  await pageOneTab.locator('.report-header-partners').screenshot({ path: partnersScreenshotPath });
  await pageOneTab.locator('[data-testid="report-first-page"]').screenshot({ path: page1ScreenshotPath });
  const pageOnePdf = await pageOneTab.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: PDF_MARGINS,
  });
  await pageOneTab.close();

  const pageTwoTab = await browser.newPage();
  await loadReportPrintPage(pageTwoTab);
  await isolateReportPage(pageTwoTab, '2');
  await pageTwoTab.locator('[data-testid="report-second-page"]').screenshot({ path: page2ScreenshotPath });
  const pageTwoPdf = await pageTwoTab.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
    margin: PDF_MARGINS,
  });
  await pageTwoTab.close();

  const pageOneDoc = await PDFDocument.load(pageOnePdf);
  const pageTwoDoc = await PDFDocument.load(pageTwoPdf);
  const merged = await mergePdfDocuments([new Uint8Array(pageOnePdf), new Uint8Array(pageTwoPdf)]);
  writeFileSync(pdfPath, merged);

  const parser = new PDFParse({ data: Buffer.from(merged) });
  const textResult = await parser.getText();
  await parser.destroy();
  const extractedText = textResult.pages.map((p) => p.text).join('\n');
  const analysis = analyzePdfVectorQuality(textResult.pages, extractedText);

  const result = {
    ok: analysis.isVector && analysis.pageCount === 2,
    pdfFile: pdfPath,
    pdfBytes: merged.byteLength,
    partnersScreenshot: partnersScreenshotPath,
    page1Screenshot: page1ScreenshotPath,
    page2Screenshot: page2ScreenshotPath,
    partnersGridWidthPx: partnersBox?.width ?? 0,
    pageOnePhysicalPages: pageOneDoc.getPageCount(),
    pageTwoPhysicalPages: pageTwoDoc.getPageCount(),
    analysis,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!analysis.isVector) throw new Error('PDF is not vector text.');
  if (analysis.pageCount !== 2) throw new Error(`Expected 2 pages, got ${analysis.pageCount}.`);
  if (pageOneDoc.getPageCount() !== 1 || pageTwoDoc.getPageCount() !== 1) {
    throw new Error(
      `Each logical page must produce exactly 1 physical page (got ${pageOneDoc.getPageCount()}+${pageTwoDoc.getPageCount()}).`,
    );
  }
  if (!analysis.hasOrganizers) throw new Error('Organizers section text missing from PDF.');
  if ((partnersBox?.width ?? 0) < 280) throw new Error('Organizers grid too narrow — cramped layout.');
} finally {
  await browser.close();
}
