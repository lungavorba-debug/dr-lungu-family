/**
 * Verify WhatsApp delivery UI on completion page + email regression.
 * Usage: node scripts/verify-whatsapp-delivery-ui.mjs
 */
import { chromium } from 'playwright';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';
const LOGIN_EMAIL = 'admin@medscreen.ro';
const LOGIN_PASSWORD = 'Admin123!';

const FIELD = {
  first_name: '#conversation-field-first_name',
  last_name: '#conversation-field-last_name',
  phone: '#conversation-field-phone',
  age: '#conversation-field-age',
};

const checks = {};
const consoleErrors = [];
const apiErrors = [];

function mark(name, pass, detail = '') {
  checks[name] = { pass, detail };
}

function uniquePhone() {
  const suffix = String(Date.now()).slice(-7);
  return `07${suffix.padStart(8, '0').slice(0, 8)}`;
}

async function apiFetch(pathname, options = {}, token = null) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${API}${pathname}`, { ...options, headers });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok || json?.status === 'error') {
    apiErrors.push(`${options.method ?? 'GET'} ${pathname} -> ${response.status} ${json?.error?.message ?? text.slice(0, 160)}`);
  }
  return { response, json };
}

async function loginApi() {
  const { response, json } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  return { ok: response.ok, token: json?.data?.token ?? null };
}

async function clearScreeningWorkflowStorage(page) {
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('medscreen_screening_')) sessionStorage.removeItem(key);
    }
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('medscreen_screening_workflow')) localStorage.removeItem(key);
    }
  });
}

async function loginAndPrepare(page) {
  await page.goto(`${WEB}/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await clearScreeningWorkflowStorage(page);
  await page.fill('input[type="email"]', LOGIN_EMAIL);
  await page.fill('input[type="password"]', LOGIN_PASSWORD);
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 30000 });
  if (page.url().includes('/campaigns/select')) {
    const continueBtn = page.getByRole('button', { name: /continuă/i }).first();
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
      await page.waitForURL((url) => !url.pathname.includes('/campaigns/select'), { timeout: 15000 });
    }
  }
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.getByRole('button', { name: /screening nou/i }).first().waitFor({ state: 'visible', timeout: 30000 });
}

async function fillDemographics(page, phone) {
  await page.locator(FIELD.first_name).waitFor({ state: 'visible', timeout: 20000 });
  await page.fill(FIELD.first_name, 'Ion');
  await page.fill(FIELD.last_name, 'WhatsApp');
  await page.fill(FIELD.phone, phone);
  await page.fill(FIELD.age, '45');
  await page.getByRole('button', { name: 'Masculin' }).click();
  await page.getByRole('button', { name: 'Pitești' }).click();
}

async function fillMeasurements(page) {
  const vals = {
    systolic_bp: '120',
    diastolic_bp: '80',
    pulse: '72',
    oxygen_saturation: '98',
    blood_glucose: '95',
    weight_kg: '80',
    height_cm: '178',
    waist_circumference_cm: '90',
  };
  for (const [field, value] of Object.entries(vals)) {
    await page.locator(`#${field}`).fill(value);
  }
  await page.getByRole('button', { name: /A jeun/i }).click();
}

async function runWorkflowToCompletion(page) {
  await loginAndPrepare(page);
  await page.getByRole('button', { name: /screening nou/i }).first().click();
  await page.waitForURL('**/screening', { timeout: 15000 });

  const phone = uniquePhone();
  await fillDemographics(page, phone);
  const existing = page.getByRole('button', { name: /continuă cu participant existent/i });
  if (await existing.isVisible().catch(() => false)) await existing.click();
  await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
  await page.waitForURL('**/screening/anamnesis', { timeout: 30000 });
  await page.getByRole('button', { name: /continuă la măsurători/i }).click();
  await page.waitForURL('**/screening/measurements', { timeout: 30000 });

  await fillMeasurements(page);
  await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
  const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
  if (await confirm.isVisible({ timeout: 5000 }).catch(() => false)) await confirm.click();
  await page.waitForURL('**/screening/results', { timeout: 60000 });
  await page.getByRole('button', { name: /raport pentru participant/i }).click();
  await page.waitForURL('**/screening/report', { timeout: 30000 });

  const sigBtn = page.getByRole('button', { name: /continuă la semnătură/i });
  await sigBtn.waitFor({ state: 'visible', timeout: 180000 });
  for (let i = 0; i < 180; i += 1) {
    if (await sigBtn.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(1000);
  }
  await sigBtn.click();
  await page.waitForURL('**/screening/signature', { timeout: 20000 });

  const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
  await canvas.waitFor({ state: 'visible', timeout: 10000 });
  const box = await canvas.boundingBox();
  if (box && box.width > 10) {
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
  }

  await page.getByRole('button', { name: /salvează semnătura/i }).click();
  await page.waitForURL('**/screening/complete', { timeout: 30000 });
  await page
    .getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i)
    .first()
    .waitFor({ timeout: 120000 });
}

async function main() {
  const { ok: loginOk, token } = await loginApi();
  mark('api_login', loginOk, loginOk ? 'ok' : 'failed');
  if (!loginOk || !token) {
    console.log(JSON.stringify({ status: 'failed', checks, consoleErrors, apiErrors }, null, 2));
    process.exit(1);
  }

  const whatsappConfigured = Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() && process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
  );
  mark('meta_credentials_in_env', whatsappConfigured, whatsappConfigured ? 'configured' : 'not configured');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/WebSocket connection to 'ws:/i.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/api/v1/')) return;
    if (response.status() >= 400) {
      apiErrors.push(`${response.request().method()} ${url} -> ${response.status()}`);
    }
  });

  let screeningId = null;

  try {
    await runWorkflowToCompletion(page);
    await page.getByText(/livrare raport/i).first().waitFor({ state: 'visible', timeout: 30000 });

    const emailBtn = page.getByRole('button', { name: /trimite pe email|se verifică emailul/i });
    const whatsappBtn = page.getByRole('button', { name: /trimite pe whatsapp|se verifică whatsapp/i });
    const metaMessage = page.getByText('Configurează Meta Business pentru activare.');

    mark('email_button_visible', await emailBtn.isVisible().catch(() => false), 'Trimite pe email');
    mark('whatsapp_button_visible', await whatsappBtn.isVisible().catch(() => false), 'Trimite pe WhatsApp');

    screeningId = await page.evaluate(() => {
      const keys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
      if (!keys.length) return null;
      return keys[0].replace('medscreen_screening_pdf:', '');
    });
    mark('screening_id_resolved', Boolean(screeningId), screeningId ?? 'missing');

    let availability = null;
    if (screeningId) {
      const { json } = await apiFetch(`/screenings/${screeningId}/delivery/availability`, {}, token);
      availability = json?.data ?? null;
      mark('delivery_availability_api', Boolean(availability), JSON.stringify(availability?.channels ?? {}));
    }

    for (let i = 0; i < 60; i += 1) {
      const loading = await whatsappBtn.textContent().catch(() => '');
      if (!/se verifică whatsapp/i.test(loading ?? '')) break;
      await page.waitForTimeout(1000);
    }

    const whatsappDisabled = await whatsappBtn.isDisabled().catch(() => true);
    const whatsappEnabled = !whatsappDisabled;
    const expectedWhatsappEnabled = Boolean(availability?.channels?.whatsapp);
    mark(
      'whatsapp_button_state_matches_config',
      whatsappEnabled === expectedWhatsappEnabled,
      `enabled=${whatsappEnabled}, expected=${expectedWhatsappEnabled}`,
    );

    if (!whatsappConfigured) {
      mark(
        'whatsapp_meta_message_when_unconfigured',
        await metaMessage.isVisible().catch(() => false),
        'Configurează Meta Business pentru activare.',
      );
    } else {
      mark('whatsapp_meta_message_when_unconfigured', true, 'skipped — credentials set');
    }

    const recipientEmail =
      process.env.E2E_TEST_EMAIL_TO?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim() ||
      'verify@test.local';

    await page.fill('#delivery-email', recipientEmail);
    for (let i = 0; i < 60; i += 1) {
      if (await emailBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    const emailEnabled = await emailBtn.isEnabled().catch(() => false);
    mark('email_button_enabled', emailEnabled, emailEnabled ? 'enabled' : 'disabled');

    if (emailEnabled) {
      await emailBtn.click();
      await page.getByText(/email trimis cu succes|raportul a fost trimis/i).first().waitFor({ timeout: 60000 });
      mark('email_send_success', true, recipientEmail);
    } else {
      mark('email_send_success', false, 'email button not enabled');
    }

    if (screeningId && emailEnabled) {
      const { json } = await apiFetch(`/screenings/${screeningId}/delivery`, {}, token);
      const emailDelivery = (json?.data?.deliveries ?? []).find((d) => d.channel === 'email' && d.status === 'sent');
      mark('delivery_history_email_recorded', Boolean(emailDelivery), emailDelivery?.recipient ?? 'none');
    }

    if (screeningId) {
      const pdfResponse = await fetch(`${API}/screenings/${screeningId}/report/pdf`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/pdf' },
      });
      const buffer = Buffer.from(await pdfResponse.arrayBuffer());
      const pdfOk = pdfResponse.ok && buffer.subarray(0, 4).toString('utf8') === '%PDF';
      mark('existing_pdf_reused_on_server', pdfOk, pdfOk ? `${buffer.length} bytes` : `HTTP ${pdfResponse.status}`);
    }

    mark('no_console_errors', consoleErrors.length === 0, consoleErrors.join(' | ') || 'clean');
    mark('no_failed_api_requests', apiErrors.length === 0, apiErrors.join(' | ') || 'clean');
    mark('workflow_error', true, 'completed');
  } catch (error) {
    mark('workflow_error', false, error instanceof Error ? error.message : String(error));
  } finally {
    await browser.close();
  }

  const required = [
    'email_button_visible',
    'whatsapp_button_visible',
    'whatsapp_button_state_matches_config',
    'email_button_enabled',
    'email_send_success',
    'existing_pdf_reused_on_server',
    'no_console_errors',
    'no_failed_api_requests',
    'workflow_error',
  ];
  if (!whatsappConfigured) {
    required.push('whatsapp_meta_message_when_unconfigured');
  }

  const passed = required.every((key) => checks[key]?.pass === true);

  console.log(
    JSON.stringify(
      {
        status: passed ? 'passed' : 'failed',
        whatsappConfigured,
        checks,
        consoleErrors,
        apiErrors,
      },
      null,
      2,
    ),
  );
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
