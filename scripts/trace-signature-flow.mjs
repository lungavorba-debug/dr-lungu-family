/**
 * Trace post-"Continuă la semnătură" flow with per-step PASS/FAIL.
 */
import { chromium } from 'playwright';
import nodemailer from 'nodemailer';

const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';
const steps = [];

function record(step, pass, detail) {
  steps.push({ step, pass, detail });
  console.log(`${pass ? '✓' : '✗'} Step ${step}: ${detail}`);
}

async function apiLogin() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@medscreen.ro', password: 'Admin123!' }),
  });
  const json = await res.json();
  return json?.data?.token ?? null;
}

async function configureSmtp(token) {
  const account = await nodemailer.createTestAccount();
  await fetch(`${API}/clinic-settings`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      section: 'smtp',
      data: {
        enabled: true,
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        user: account.user,
        pass: account.pass,
        from: account.user,
      },
    }),
  });
}

async function main() {
  const token = await apiLogin();
  await configureSmtp(token);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  try {
    await page.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'admin@medscreen.ro');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.getByRole('button', { name: /autentificare/i }).click();
    await page.waitForURL(/\/($|campaigns)/, { timeout: 30000 });
    if (page.url().includes('/campaigns/select')) {
      await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
    }

    // Quick path through screening (reuse E2E helpers inline)
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /screening nou/i }).first().click();
    await page.waitForURL('**/screening');
    const phone = `07${String(Date.now()).slice(-8)}`;
    await page.fill('#conversation-field-first_name', 'Ion');
    await page.fill('#conversation-field-last_name', 'Test');
    await page.fill('#conversation-field-phone', phone);
    await page.fill('#conversation-field-age', '45');
    await page.getByRole('button', { name: 'Masculin' }).click();
    await page.getByRole('button', { name: 'Pitești' }).click();
    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis');
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements');
    for (const [field, val] of Object.entries({
      systolic_bp: '120', diastolic_bp: '80', pulse: '72', oxygen_saturation: '98',
      blood_glucose: '95', weight_kg: '80', height_cm: '178', waist_circumference_cm: '90',
    })) {
      await page.locator(`#${field}`).fill(val);
    }
    await page.getByRole('button', { name: /A jeun/i }).click();
    await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
    const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await page.waitForURL('**/screening/results');
    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report');

    const continueBtn = page.getByRole('button', { name: /continuă la semnătură/i });
    await continueBtn.waitFor({ state: 'visible', timeout: 180000 });
    const btnEnabled = await continueBtn.isEnabled();
    record(1, btnEnabled, `ScreeningReportPage.tsx StickyActionButton onClick handler armed (enabled=${btnEnabled})`);

    const pdfInStorage = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
      return keys.length > 0 ? keys[0] : null;
    });
    record(1, Boolean(pdfInStorage), `pdf-session-storage persist key=${pdfInStorage ?? 'none'}`);

    const urlBefore = page.url();
    await continueBtn.click();
    await page.waitForTimeout(500);
    const urlAfterClick = page.url();
    const navOk = urlAfterClick.includes('/screening/signature');
    record(2, navOk, `navigate('/screening/signature') → ${urlAfterClick} (was ${urlBefore})`);

    await page.waitForTimeout(1500);
    const urlFinal = page.url();
    if (!navOk) {
      record(3, false, `router.tsx route screening/signature never reached; stuck at ${urlFinal}`);
    } else if (urlFinal.includes('/screening/report')) {
      record(3, false, `ScreeningSignaturePage.tsx:96-98 Navigate to /screening/report — generatedPdf missing in context`);
    } else if (urlFinal.includes('/screening/complete')) {
      record(3, true, 'ScreeningSignaturePage.tsx:108-112 skipped to complete (cached signature)');
    } else {
      record(3, urlFinal.includes('/screening/signature'), `ScreeningSignaturePage mounted at ${urlFinal}`);
    }

    const sigHeader = await page.getByRole('heading', { name: /semnătură participant/i }).isVisible().catch(() => false);
    record(4, sigHeader, `ScreeningSignaturePage initialization — heading visible=${sigHeader}`);

    const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
    const canvasVisible = await canvas.isVisible().catch(() => false);
    const canvasBox = canvasVisible ? await canvas.boundingBox() : null;
    record(5, canvasVisible && (canvasBox?.width ?? 0) > 10, `SignaturePad.tsx canvas visible=${canvasVisible} w=${canvasBox?.width ?? 0}`);

    const cachedSig = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_signature:'));
      return keys.length;
    });
    record(6, true, `signature-session-storage existing signatures in storage: ${cachedSig}`);

    if (canvasVisible && canvasBox) {
      await page.mouse.move(canvasBox.x + 40, canvasBox.y + canvasBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + canvasBox.width - 40, canvasBox.y + canvasBox.height / 2, { steps: 8 });
      await page.mouse.up();
    }
    const saveBtn = page.getByRole('button', { name: /salvează semnătura/i });
    const saveEnabled = await saveBtn.isEnabled().catch(() => false);
    record(7, saveEnabled, `ScreeningSignaturePage.handleSaveSignature button enabled=${saveEnabled}`);

    if (saveEnabled) {
      await saveBtn.click();
      await page.waitForURL('**/screening/complete', { timeout: 30000 });
    }
    record(8, page.url().includes('/screening/complete'), `handleSaveSignature → navigate('/screening/complete') → ${page.url()}`);

    await page.getByText(/screeningul a fost salvat pe server/i).waitFor({ timeout: 120000 });
    record(9, true, 'ScreeningCompletionPage server persist message visible');

    await page.fill('#delivery-email', 'trace@test.local');
    const emailBtn = page.getByRole('button', { name: /trimite pe email/i });
    for (let i = 0; i < 60; i++) {
      if (await emailBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    const emailOk = await emailBtn.isEnabled().catch(() => false);
    record(10, emailOk, `DeliveryOptionsPanel email button enabled=${emailOk}`);

    if (consoleErrors.length) record(15, false, `console: ${consoleErrors.join(' | ')}`);
    else record(15, true, 'no console errors');
    if (pageErrors.length) record(17, false, `pageerror: ${pageErrors.join(' | ')}`);
    else record(17, true, 'no react runtime errors');
  } catch (e) {
    record('ERR', false, e instanceof Error ? e.message : String(e));
  } finally {
    await browser.close();
  }

  console.log('\n--- SUMMARY ---');
  console.log(JSON.stringify(steps, null, 2));
  const fail = steps.some((s) => !s.pass);
  process.exit(fail ? 1 : 0);
}

main();
