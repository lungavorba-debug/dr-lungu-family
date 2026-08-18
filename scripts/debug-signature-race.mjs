/** Race: reload report page, click signature before PDF regen completes */
import { chromium } from 'playwright';
const WEB = 'http://127.0.0.1:5173';

async function readState(page) {
  return page.evaluate(() => ({
    url: location.href,
    pdfKeys: Object.keys(sessionStorage).filter(k => k.startsWith('medscreen_screening_pdf:')),
    btnDisabled: document.querySelector('button')?.textContent,
    sigHeading: document.body.innerText.includes('Semnătură participant'),
    reportHeading: document.body.innerText.includes('Raport participant'),
    pdfMsg: document.body.innerText.includes('PDF generat') || document.body.innerText.includes('Se generează PDF'),
    body: document.body.innerText.slice(0, 350),
  }));
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [], pageErrors = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(e.message));

await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
await page.fill('input[type="email"]', 'admin@medscreen.ro');
await page.fill('input[type="password"]', 'Admin123!');
await page.getByRole('button', { name: /autentificare/i }).click();
await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 60000 });
if (page.url().includes('/campaigns/select')) await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});

await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.getByRole('button', { name: /screening nou/i }).first().click();
await page.waitForURL('**/screening');
const phone = `07${String(Date.now()).slice(-8)}`;
await page.fill('#conversation-field-first_name', 'Ion');
await page.fill('#conversation-field-last_name', 'Race');
await page.fill('#conversation-field-phone', phone);
await page.fill('#conversation-field-age', '45');
await page.getByRole('button', { name: 'Masculin' }).click();
await page.getByRole('button', { name: 'Pitești' }).click();
await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
await page.waitForURL('**/screening/anamnesis');
await page.getByRole('button', { name: /continuă la măsurători/i }).click();
await page.waitForURL('**/screening/measurements');
for (const [f,v] of Object.entries({systolic_bp:'120',diastolic_bp:'80',pulse:'72',oxygen_saturation:'98',blood_glucose:'95',weight_kg:'80',height_cm:'178',waist_circumference_cm:'90'})) await page.locator(`#${f}`).fill(v);
await page.getByRole('button', { name: /A jeun/i }).click();
await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
const c = page.getByRole('button', { name: /confirmă și continuă/i });
if (await c.isVisible().catch(() => false)) await c.click();
await page.waitForURL('**/screening/results');
await page.getByRole('button', { name: /raport pentru participant/i }).click();
await page.waitForURL('**/screening/report');
const btn = page.getByRole('button', { name: /continuă la semnătură/i });
for (let i = 0; i < 180; i++) { if (await btn.isEnabled().catch(() => false)) break; await page.waitForTimeout(1000); }

await page.reload({ waitUntil: 'domcontentloaded' });
const immediate = await readState(page);
const btnAfter = page.getByRole('button', { name: /continuă la semnătură/i });
const enabledImmediate = await btnAfter.isEnabled().catch(() => false);

// Force click even if disabled to see what happens
await btnAfter.click({ force: true }).catch(() => {});
await page.waitForTimeout(2500);
const afterForceClick = await readState(page);

// Also test: wait for regen then click
await page.reload({ waitUntil: 'domcontentloaded' });
const btn2 = page.getByRole('button', { name: /continuă la semnătură/i });
for (let i = 0; i < 120; i++) { if (await btn2.isEnabled().catch(() => false)) break; await page.waitForTimeout(500); }
const beforeWaitClick = await readState(page);
await btn2.click();
await page.waitForTimeout(2500);
const afterWaitClick = await readState(page);

console.log(JSON.stringify({
  scenario: 'RACE_reload_click',
  consoleErrors, pageErrors,
  immediate, enabledImmediate, afterForceClick,
  beforeWaitClick, afterWaitClick,
  raceFail: afterForceClick.url.includes('/screening/report') && !afterForceClick.sigHeading,
}, null, 2));
await browser.close();
