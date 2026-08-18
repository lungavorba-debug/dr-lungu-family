import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/';
const logs = [];
const errors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on('console', (msg) => logs.push(`[${msg.type()}] ${msg.text()}`));
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}\n${err.stack ?? ''}`));
page.on('requestfailed', (req) => errors.push(`requestfailed: ${req.url()} ${req.failure()?.errorText}`));

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
} catch (error) {
  errors.push(`goto: ${error instanceof Error ? error.message : String(error)}`);
}

const bodyText = await page.locator('body').innerText().catch(() => '');
const rootHtml = await page.locator('#root').innerHTML().catch(() => '');
const title = await page.title();
const screenshotPath = 'apps/web/scripts/ui-screenshots/frontend-blank-debug.png';
await page.screenshot({ path: screenshotPath, fullPage: true });

console.log('URL', url);
console.log('TITLE', title);
console.log('BODY_TEXT', JSON.stringify(bodyText.slice(0, 500)));
console.log('ROOT_HTML_LEN', rootHtml.length);
console.log('ROOT_HTML_PREVIEW', rootHtml.slice(0, 800));
console.log('SCREENSHOT', screenshotPath);
console.log('--- ERRORS ---');
for (const e of errors) console.log(e);
console.log('--- CONSOLE ---');
for (const l of logs.slice(0, 40)) console.log(l);

await browser.close();
