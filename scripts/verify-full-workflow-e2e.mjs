/**
 * Full operator workflow verification (steps 1–17).
 * Usage: node scripts/verify-full-workflow-e2e.mjs
 *
 * SMTP: uses Gmail from apps/api/.env when SMTP_HOST is set.
 * Falls back to Ethereal via clinic-settings only when SMTP_HOST is missing.
 */
import { chromium } from 'playwright';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';
const LOGIN_EMAIL = 'admin@medscreen.ro';
const LOGIN_PASSWORD = 'Admin123!';
const USE_GMAIL_SMTP = Boolean(process.env.SMTP_HOST?.trim());

const FIELD = {
  first_name: '#conversation-field-first_name',
  last_name: '#conversation-field-last_name',
  phone: '#conversation-field-phone',
  age: '#conversation-field-age',
};

const MEASUREMENTS = {
  systolic_bp: '120',
  diastolic_bp: '80',
  pulse: '72',
  oxygen_saturation: '98',
  blood_glucose: '95',
  weight_kg: '80',
  height_cm: '178',
  waist_circumference_cm: '90',
};

const results = {};
const consoleErrors = [];
const apiErrors = [];
let authToken = null;
let screeningId = null;
let reportUrl = null;
let etherealAccount = null;
let smtpMode = USE_GMAIL_SMTP ? 'gmail' : 'ethereal';
let emailDeliveryInfo = null;

function mark(step, pass, detail = '') {
  results[step] = { pass, detail };
}

function uniquePhone() {
  const suffix = String(Date.now()).slice(-7);
  return `07${suffix.padStart(8, '0').slice(0, 8)}`;
}

async function apiFetch(pathname, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers ?? {}),
  };
  const response = await fetch(`${API}${pathname}`, { ...options, headers });
  const isPdf = (headers.Accept ?? '').includes('application/pdf');

  if (isPdf) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!response.ok) {
      apiErrors.push(`${options.method ?? 'GET'} ${pathname} -> ${response.status} PDF fetch failed`);
    }
    return { response, json: null, text: null, buffer };
  }

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok || json?.status === 'error') {
    apiErrors.push(`${options.method ?? 'GET'} ${pathname} -> ${response.status} ${json?.error?.message ?? text.slice(0, 200)}`);
  }
  return { response, json, text, buffer: null };
}

async function loginApi() {
  const { response, json } = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  authToken = json?.data?.token ?? null;
  return response.ok && Boolean(authToken);
}

async function configureSmtpForE2E() {
  if (USE_GMAIL_SMTP) {
    return true;
  }

  etherealAccount = await nodemailer.createTestAccount();
  const { response, json } = await apiFetch('/clinic-settings', {
    method: 'PATCH',
    body: JSON.stringify({
      section: 'smtp',
      data: {
        enabled: true,
        host: etherealAccount.smtp.host,
        port: etherealAccount.smtp.port,
        secure: etherealAccount.smtp.secure,
        user: etherealAccount.user,
        pass: etherealAccount.pass,
        from: etherealAccount.user,
      },
    }),
  });
  return response.ok && json?.status !== 'error';
}

function resolveRecipientEmail() {
  if (USE_GMAIL_SMTP) {
    return (
      process.env.E2E_TEST_EMAIL_TO?.trim() ||
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.SMTP_USER?.trim() ||
      ''
    );
  }
  return etherealAccount?.user ?? '';
}

async function fillDemographics(page, phone) {
  await page.locator(FIELD.first_name).waitFor({ state: 'visible', timeout: 20000 });
  await page.fill(FIELD.first_name, 'Ion');
  await page.fill(FIELD.last_name, 'Test');
  await page.fill(FIELD.phone, phone);
  await page.fill(FIELD.age, '45');
  await page.getByRole('button', { name: 'Masculin' }).click();
  await page.getByRole('button', { name: 'Pitești' }).click();
}

async function fillMeasurements(page) {
  for (const [field, value] of Object.entries(MEASUREMENTS)) {
    await page.locator(`#${field}`).fill(value);
  }
  await page.getByRole('button', { name: /A jeun/i }).click();
}

async function resolveScreeningId(page) {
  return page.evaluate(() => {
    const pdfKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
    if (pdfKeys[0]) {
      return pdfKeys[0].replace('medscreen_screening_pdf:', '');
    }
    const workflowKeys = Object.keys(sessionStorage).filter((k) =>
      k.startsWith('medscreen_screening_workflow:'),
    );
    for (const key of workflowKeys) {
      try {
        const parsed = JSON.parse(sessionStorage.getItem(key) ?? '{}');
        const id = parsed?.clinicalEvaluation?.screening_id;
        if (id) return id;
      } catch {
        // ignore
      }
    }
    return null;
  });
}

async function verifyEmailContent() {
  if (USE_GMAIL_SMTP) {
    const sent = emailDeliveryInfo?.status === 'sent';
    const hasSender = Boolean(emailDeliveryInfo?.sender);
    const hasRecipient = Boolean(emailDeliveryInfo?.recipient);
    const hasSubject = Boolean(emailDeliveryInfo?.subject);
    const pass = sent && hasSender && hasRecipient && hasSubject;
    return {
      pass,
      detail: `mode=gmail sent=${sent} sender=${hasSender} recipient=${hasRecipient} subject=${hasSubject}`,
      previewUrl: null,
    };
  }

  const previewUrl =
    emailDeliveryInfo?.preview_url ??
    (emailDeliveryInfo?.provider_message_id
      ? nodemailer.getTestMessageUrl({ messageId: emailDeliveryInfo.provider_message_id })
      : null);
  if (!previewUrl) {
    return { pass: false, detail: 'no Ethereal preview URL' };
  }

  const previewResponse = await fetch(previewUrl);
  const html = await previewResponse.text();
  const hasHtmlBody = /<html[\s>]/i.test(html) && html.length > 500;
  const hasReportLink = /Vezi raportul online|href="https?:\/\//i.test(html);
  const hasPdfAttachment = /application\/pdf|\.pdf/i.test(html);

  const pass = hasHtmlBody && hasReportLink && hasPdfAttachment;
  return {
    pass,
    detail: `html=${hasHtmlBody} link=${hasReportLink} pdf=${hasPdfAttachment}`,
    previewUrl,
  };
}

async function main() {
  await mkdir(path.join(ROOT, 'tmp'), { recursive: true }).catch(() => {});

  const smtpReady = await loginApi();
  if (!smtpReady) {
    throw new Error('API login failed during SMTP setup');
  }
  const smtpConfigured = await configureSmtpForE2E();
  if (!smtpConfigured) {
    throw new Error(
      USE_GMAIL_SMTP
        ? 'Gmail SMTP expected via apps/api/.env but setup check failed'
        : 'Failed to configure Ethereal SMTP via clinic-settings',
    );
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    acceptDownloads: true,
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
  page.on('response', (response) => {
    const url = response.url();
    if (!url.includes('/api/v1/')) return;
    if (response.status() >= 400) {
      apiErrors.push(`${response.request().method()} ${url} -> HTTP ${response.status()}`);
    }
    if (url.includes('/delivery/email') && response.request().method() === 'POST' && response.status() < 400) {
      response
        .json()
        .then((json) => {
          emailDeliveryInfo = json?.data ?? null;
        })
        .catch(() => {});
    }
  });

  try {
    // Step 1 — Login
    await page.goto(`${WEB}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.fill('input[type="email"]', LOGIN_EMAIL);
    await page.fill('input[type="password"]', LOGIN_PASSWORD);
    await page.getByRole('button', { name: /autentificare/i }).click();
    await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 30000 });
    const apiLoginOk = await loginApi();
    mark(1, apiLoginOk && !page.url().includes('/login'), page.url());

    if (page.url().includes('/campaigns/select')) {
      const continueBtn = page.getByRole('button', { name: /continuă/i });
      if (await continueBtn.isVisible().catch(() => false)) {
        await continueBtn.click();
        await page.waitForURL(/\//, { timeout: 15000 });
      }
    }

    // Step 2 — Start new screening
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /screening nou/i }).first().click();
    await page.waitForURL('**/screening', { timeout: 15000 });
    mark(2, page.url().includes('/screening'), page.url());

    // Step 3 — Questionnaire
    const phone = uniquePhone();
    await fillDemographics(page, phone);

    const existingBanner = page.getByRole('button', { name: /continuă cu participant existent/i });
    if (await existingBanner.isVisible().catch(() => false)) {
      await existingBanner.click();
    }

    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis', { timeout: 30000 });
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements', { timeout: 30000 });
    mark(3, page.url().includes('/screening/measurements'), page.url());

    // Step 4 — Open medical report
    await fillMeasurements(page);
    await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
    const confirmBtn = page.getByRole('button', { name: /confirmă și continuă/i });
    if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    await page.waitForURL('**/screening/results', { timeout: 60000 });
    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report', { timeout: 30000 });
    mark(4, page.url().includes('/screening/report'), page.url());

    screeningId = await resolveScreeningId(page);

    // Step 5 — Generate PDF
    const continueSig = page.getByRole('button', { name: /continuă la semnătură/i });
    await continueSig.waitFor({ state: 'visible', timeout: 180000 });
    await page.getByText(/pdf generat/i).first().waitFor({ timeout: 180000 }).catch(() => {});
    const pdfReady = await continueSig.isEnabled();
    mark(5, pdfReady, pdfReady ? 'PDF generated' : 'Continue button disabled');
    if (!pdfReady) throw new Error('PDF not generated');

    // Step 6 — Download PDF
    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
    await page.getByRole('button', { name: /descarcă pdf/i }).click();
    const download = await downloadPromise;
    const downloadPath = path.join(ROOT, 'tmp-e2e-download.pdf');
    await download.saveAs(downloadPath);
    const pdfBytes = await readFile(downloadPath);
    const pdfValid = pdfBytes.subarray(0, 4).toString('utf8') === '%PDF';
    mark(6, pdfValid, `${pdfBytes.length} bytes`);

    // Step 7 — Continue to signature
    await continueSig.click();
    await page.waitForURL('**/screening/signature', { timeout: 20000 });
    mark(7, page.url().includes('/screening/signature'), page.url());

    // Step 8 — Draw signature
    const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    const box = await canvas.boundingBox();
    if (!box || box.width < 10) throw new Error('Signature canvas not sized');
    await page.mouse.move(box.x + 40, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2, { steps: 12 });
    await page.mouse.up();
    mark(8, true, 'Drew signature stroke');

    // Step 9 — Save signature
    await page.getByRole('button', { name: /salvează semnătura/i }).click();
    await page.waitForURL('**/screening/complete', { timeout: 30000 });
    mark(9, page.url().includes('/screening/complete'), page.url());

    // Step 10 — Complete screening (server persist)
    await page
      .getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i)
      .first()
      .waitFor({ timeout: 120000 });
    const persistOk = await page
      .getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i)
      .isVisible()
      .catch(() => false);
    mark(10, persistOk, persistOk ? 'Persisted on server' : 'Persist failed');

    screeningId = screeningId ?? (await resolveScreeningId(page));

    // Step 11 — Verify PDF stored on server
    let pdfStored = false;
    if (screeningId && authToken) {
      const { response, json, buffer } = await apiFetch(`/screenings/${screeningId}/report/pdf`, {
        headers: { Accept: 'application/pdf' },
      });
      pdfStored = response.ok && buffer != null;
      if (pdfStored && buffer) {
        pdfStored = buffer.subarray(0, 4).toString('utf8') === '%PDF';
        mark(11, pdfStored, `${buffer.length} bytes`);
      } else {
        mark(11, false, json?.error?.message ?? `HTTP ${response.status}`);
      }
    } else {
      mark(11, false, 'missing screeningId or token');
    }

    // Step 12 — Send email
    await page
      .getByText(/livrare raport/i)
      .first()
      .waitFor({ state: 'visible', timeout: 30000 });
    const recipientEmail = resolveRecipientEmail();
    if (!recipientEmail) {
      throw new Error('No recipient email configured for E2E delivery test');
    }
    await page.fill('#delivery-email', recipientEmail);
    const emailBtn = page.getByRole('button', { name: /trimite pe email|se verifică emailul/i });
    let emailReady = false;
    for (let attempt = 0; attempt < 90; attempt += 1) {
      const { json } = await apiFetch(`/screenings/${screeningId}/delivery/availability`);
      if (json?.data?.channels?.email && (await emailBtn.isEnabled().catch(() => false))) {
        emailReady = true;
        break;
      }
      await page.waitForTimeout(1000);
    }
    if (!emailReady) {
      const debug = await page.evaluate(() => ({
        body: document.body.innerText.slice(0, 1200),
        buttons: Array.from(document.querySelectorAll('button')).map((b) => ({
          text: b.textContent?.trim(),
          disabled: b.disabled,
        })),
      }));
      throw new Error(`Email delivery channel not ready: ${JSON.stringify(debug)}`);
    }
    await page.getByRole('button', { name: /trimite pe email/i }).click();
    await page
      .getByText(/email trimis cu succes/i)
      .waitFor({ timeout: 60000 });
    const emailMsg = await page.locator('[role="status"]').last().textContent().catch(() => '');
    const emailSent = /email trimis cu succes/i.test(emailMsg ?? '');
    mark(12, emailSent, emailMsg?.trim() ?? 'no message');

    // Step 13 — Verify email content
    if (!emailDeliveryInfo && screeningId) {
      const deliveries = await apiFetch(`/screenings/${screeningId}/delivery`);
      const lastEmail =
        deliveries.json?.data?.deliveries?.find?.((d) => d.channel === 'email' && d.status === 'sent') ??
        deliveries.json?.data?.deliveries?.[0];
      emailDeliveryInfo = lastEmail ?? null;
    }
    const emailCheck = await verifyEmailContent();
    mark(13, emailSent && emailCheck.pass, emailCheck.detail);

    // Step 14 — Open stored report
    if (screeningId) {
      const report = await apiFetch(`/screenings/${screeningId}/report`);
      const participantReport = report.json?.data?.participant_report;
      reportUrl = participantReport?.qr?.url ?? null;
      let reportOpened = false;
      if (reportUrl) {
        const reportPage = await context.newPage();
        try {
          const reportResponse = await reportPage.goto(reportUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 30000,
          });
          reportOpened = (reportResponse?.status() ?? 0) < 400;
        } finally {
          await reportPage.close();
        }
      }
      const apiReportOk = report.response.ok && Boolean(participantReport?.metadata?.report_id);
      mark(14, apiReportOk && (reportOpened || Boolean(reportUrl)), reportUrl ?? 'no report url');
    } else {
      mark(14, false, 'no screeningId');
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    for (let i = 1; i <= 17; i += 1) {
      if (!results[i]) mark(i, false, msg);
    }
  } finally {
    const reactErrors = consoleErrors.filter((e) => /react|runtime|uncaught|pageerror/i.test(e));
    if (!results[15]) mark(15, consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | ') || 'none');
    if (!results[16]) mark(16, apiErrors.length === 0, apiErrors.slice(0, 5).join(' | ') || 'none');
    if (!results[17]) mark(17, reactErrors.length === 0, reactErrors.slice(0, 3).join(' | ') || 'none');
    await browser.close();
  }

  const out = {
    results,
    screeningId,
    reportUrl,
    consoleErrors,
    apiErrors,
    smtpMode,
    etherealUser: etherealAccount?.user ?? null,
  };
  await writeFile(path.join(ROOT, 'tmp-e2e-workflow-results.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));

  const allPass = Object.values(results).every((r) => r.pass);
  process.exit(allPass ? 0 : 1);
}

main();
