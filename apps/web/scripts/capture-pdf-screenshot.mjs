import { join } from 'node:path';
import { chromium } from 'playwright';

const outDir = 'apps/web/scripts/ui-screenshots';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 2000 } });
page.on('console', (msg) => console.log('browser:', msg.text()));
page.on('pageerror', (err) => console.error('pageerror:', err.message));
await page.goto('http://localhost:8767/viewer/', { waitUntil: 'networkidle', timeout: 120000 });
await page.waitForFunction(() => document.getElementById('status')?.textContent === 'ready', { timeout: 120000 });
await page.locator('#c').screenshot({ path: join(outDir, 'participant-report-pdf-measurements.png') });
await browser.close();
console.log('saved pdf screenshot');
