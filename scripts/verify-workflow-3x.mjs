/**
 * Full workflow verification x3: report → PDF → signature → complete → email
 */
import { chromium } from 'playwright';

const WEB = 'http://127.0.0.1:5173';
const EMAIL_TO = process.env.E2E_TEST_EMAIL_TO ?? 'drlungufamily@gmail.com';

async function loginClean(page) {
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
  await page.fill('input[type="email"]', 'admin@medscreen.ro');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 60000 });
  if (page.url().includes('/campaigns/select')) {
    await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
  }
}

async function runOnce(runIndex) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const checks = {};
  const mark = (k, pass, detail = '') => { checks[k] = { pass, detail }; };

  try {
    await loginClean(page);
    await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /screening nou/i }).first().click();
    await page.waitForURL('**/screening', { timeout: 60000 });

    const phone = `07${String(Date.now()).slice(-8)}`;
    await page.fill('#conversation-field-first_name', 'Ion');
    await page.fill('#conversation-field-last_name', `Run${runIndex}`);
    await page.fill('#conversation-field-phone', phone);
    await page.fill('#conversation-field-age', '45');
    await page.getByRole('button', { name: 'Masculin' }).click();
    await page.getByRole('button', { name: 'Pitești' }).click();
    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis');
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements');
    for (const [f, v] of Object.entries({
      systolic_bp: '120', diastolic_bp: '80', pulse: '72', oxygen_saturation: '98',
      blood_glucose: '95', weight_kg: '80', height_cm: '178', waist_circumference_cm: '90',
    })) await page.locator(`#${f}`).fill(v);
    await page.getByRole('button', { name: /A jeun/i }).click();
    await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
    const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await page.waitForURL('**/screening/results');
    mark('screening', true, phone);

    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report');
    mark('report', page.url().includes('/screening/report'), page.url());

    const sigBtn = page.getByRole('button', { name: /continuă la semnătură/i });
    for (let i = 0; i < 180; i++) {
      if (await sigBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    const pdfReady = await sigBtn.isEnabled();
    const pdfInStorage = await page.evaluate(() =>
      Object.keys(sessionStorage).some((k) => k.startsWith('medscreen_screening_pdf:')),
    );
    mark('pdf', pdfReady && pdfInStorage, `btn=${pdfReady} storage=${pdfInStorage}`);

    await sigBtn.click();
    await page.waitForTimeout(2500);
    const sigUrl = page.url();
    const sigHeading = await page.getByRole('heading', { name: /semnătură participant/i }).isVisible().catch(() => false);
    const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
    const canvasBox = await canvas.boundingBox();
    mark('signature', sigUrl.includes('/screening/signature') && sigHeading && (canvasBox?.width ?? 0) > 10, sigUrl);

    if (canvasBox) {
      await page.mouse.move(canvasBox.x + 40, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width - 40, canvasBox.y + canvasBox.height / 2, { steps: 8 });
      await page.mouse.up();
    }
    await page.getByRole('button', { name: /salvează semnătura/i }).click();
    await page.waitForURL('**/screening/complete', { timeout: 30000 });
    await page.getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i).waitFor({ timeout: 120000 });
    mark('complete', page.url().includes('/screening/complete'), page.url());

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const reloadOk = page.url().includes('/screening/complete') &&
      await page.getByText(/screening finalizat/i).isVisible().catch(() => false);
    mark('complete_reload', reloadOk, page.url());

    await page.fill('#delivery-email', EMAIL_TO);
    const emailBtn = page.getByRole('button', { name: /trimite pe email/i });
    for (let i = 0; i < 90; i++) {
      if (await emailBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    await emailBtn.click();
    await page.getByText(/email trimis cu succes/i).waitFor({ timeout: 60000 });
    const emailMsg = await page.locator('[role="status"]').last().textContent().catch(() => '');
    mark('email', /email trimis cu succes/i.test(emailMsg ?? ''), emailMsg?.trim().slice(0, 120) ?? '');
  } catch (e) {
    mark('fatal', false, e instanceof Error ? e.message : String(e));
  } finally {
    await browser.close();
  }

  const pass = Object.values(checks).every((c) => c.pass);
  return { runIndex, pass, checks };
}

const results = [];
for (let i = 1; i <= 3; i++) {
  results.push(await runOnce(i));
}

console.log(JSON.stringify({ results, allPass: results.every((r) => r.pass) }, null, 2));
process.exit(results.every((r) => r.pass) ? 0 : 1);
