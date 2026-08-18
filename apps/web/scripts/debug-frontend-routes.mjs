import { chromium } from 'playwright';

const urls = ['http://localhost:5173/', 'http://localhost:5173/login'];
const errors = [];
const logs = [];

const browser = await chromium.launch({ headless: true });
for (const url of urls) {
  const page = await browser.newPage();
  page.on('console', (msg) => logs.push(`[${url}] [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (err) => errors.push(`[${url}] pageerror: ${err.message}`));
  page.on('requestfailed', (req) => {
    if (req.url().includes('/src/') || req.url().includes('@medscreen')) {
      errors.push(`[${url}] requestfailed: ${req.url()} ${req.failure()?.errorText}`);
    }
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(2000);
    const text = await page.locator('body').innerText();
    console.log('URL', url, 'TEXT', text.slice(0, 120).replace(/\n/g, ' | '));
  } catch (e) {
    errors.push(`[${url}] goto: ${e.message}`);
  }
  await page.close();
}
await browser.close();
console.log('--- ERRORS ---');
errors.forEach((e) => console.log(e));
console.log('--- FAILED MODULE REQUESTS ---');
logs.filter((l) => l.includes('error') || l.includes('failed')).forEach((l) => console.log(l));
