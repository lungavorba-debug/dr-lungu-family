/**
 * Full E2E x3 — report, PDF, signature, complete, email, refresh survival.
 */
import { chromium } from 'playwright';
import dotenv from 'dotenv';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const API = process.env.API_URL ?? 'http://127.0.0.1:3001/api/v1';
const LOGIN_EMAIL = 'admin@medscreen.ro';
const LOGIN_PASSWORD = 'Admin123!';
const EMAIL_TO = process.env.E2E_TEST_EMAIL_TO ?? process.env.SMTP_FROM_EMAIL ?? 'drlungufamily@gmail.com';

const FIELD = {
  first_name: '#conversation-field-first_name',
  last_name: '#conversation-field-last_name',
  phone: '#conversation-field-phone',
  age: '#conversation-field-age',
};

const SCREENING_STORAGE_PREFIXES = [
  'medscreen_screening_workflow:',
  'medscreen_screening_pdf:',
  'medscreen_screening_signature:',
  'medscreen_conversation_draft:',
];
const SCREENING_STORAGE_KEYS = ['medscreen_screening_anamnesis', 'medscreen_active_patient'];

function uniquePhone() {
  return `07${String(Date.now()).slice(-8)}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clearScreeningWorkflowStorage(page) {
  await page.evaluate(({ prefixes, keys }) => {
    for (const k of [...Object.keys(sessionStorage)]) {
      if (prefixes.some((p) => k.startsWith(p)) || keys.includes(k)) sessionStorage.removeItem(k);
    }
    for (const k of [...Object.keys(localStorage)]) {
      if (prefixes.some((p) => k.startsWith(p))) localStorage.removeItem(k);
    }
  }, { prefixes: SCREENING_STORAGE_PREFIXES, keys: SCREENING_STORAGE_KEYS });
}

async function readState(page) {
  return page.evaluate(() => {
    const pdfKey = Object.keys(sessionStorage).find((k) => k.startsWith('medscreen_screening_pdf:'));
    const sigKey = Object.keys(sessionStorage).find((k) => k.startsWith('medscreen_screening_signature:'));
    const wfKey = Object.keys(localStorage).find((k) => k.startsWith('medscreen_screening_workflow:'));
    const parse = (raw) => { try { return JSON.parse(raw ?? '{}'); } catch { return null; } };
    const pdf = pdfKey ? parse(sessionStorage.getItem(pdfKey)) : null;
    const sig = sigKey ? parse(sessionStorage.getItem(sigKey)) : null;
    const wf = wfKey ? parse(localStorage.getItem(wfKey)) : null;
    const canvas = document.querySelector('canvas[aria-label="Zonă de semnătură participant"]');
    const box = canvas?.getBoundingClientRect?.();
    return {
      path: location.pathname,
      pdfKey,
      pdfBytes: pdf?.byte_length ?? null,
      pdfScreeningId: pdf?.screening_id ?? null,
      sigKey,
      sigName: sig?.participant_name ?? null,
      wfPatient: wf?.activePatient ? `${wf.activePatient.first_name} ${wf.activePatient.last_name}` : null,
      wfScreeningId: wf?.clinicalEvaluation?.screening_id ?? null,
      wfCompleted: wf?.is_completed ?? null,
      participantBanner: document.body.innerText.includes('PARTICIPANT ACTIV'),
      sigHeading: /Semnătură participant/i.test(document.body.innerText),
      completeHeading: document.body.innerText.includes('Screening finalizat'),
      reportHeading: document.body.innerText.includes('Raport participant'),
      pdfFilename: document.body.innerText.match(/MedScreen-Raport[^\n·]+/)?.[0] ?? null,
      canvas: { exists: Boolean(canvas), w: box?.width ?? 0 },
    };
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
  await page.fill(FIELD.last_name, 'Verify');
  await page.fill(FIELD.phone, phone);
  await page.fill(FIELD.age, '45');
  await page.getByRole('button', { name: 'Masculin' }).click();
  await page.getByRole('button', { name: 'Pitești' }).click();
}

async function fillMeasurements(page) {
  const vals = {
    systolic_bp: '120', diastolic_bp: '80', pulse: '72', oxygen_saturation: '98',
    blood_glucose: '95', weight_kg: '80', height_cm: '178', waist_circumference_cm: '90',
  };
  for (const [f, v] of Object.entries(vals)) await page.locator(`#${f}`).fill(v);
  await page.getByRole('button', { name: /A jeun/i }).click();
}

async function runOnce(runIndex, authToken) {
  const checks = {};
  const mark = (n, pass, detail = '') => { checks[n] = { pass, detail }; };
  const consoleErrors = [];
  const pageErrors = [];
  const networkFails = [];
  let screeningId = null;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  page.on('console', (m) => {
    if (m.type() === 'error' && !/WebSocket connection to 'ws:/i.test(m.text())) {
      consoleErrors.push(m.text());
    }
  });
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('response', (r) => {
    const url = r.url();
    if (!url.includes('/api/v1/')) return;
    if (r.status() >= 400) networkFails.push(`${r.request().method()} ${url} -> ${r.status()}`);
  });

  try {
    await loginAndPrepare(page);
    await page.getByRole('button', { name: /screening nou/i }).first().click();
    await page.waitForURL('**/screening', { timeout: 15000 });
    mark('new_screening', true, page.url());

    const phone = uniquePhone();
    await fillDemographics(page, phone);
    const existing = page.getByRole('button', { name: /continuă cu participant existent/i });
    if (await existing.isVisible().catch(() => false)) await existing.click();
    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis', { timeout: 30000 });
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements', { timeout: 30000 });
    mark('participant_data', true, phone);

    await fillMeasurements(page);
    await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
    const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
    if (await confirm.isVisible({ timeout: 5000 }).catch(() => false)) await confirm.click();
    await page.waitForURL('**/screening/results', { timeout: 60000 });
    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report', { timeout: 30000 });
    mark('generate_report', true, page.url());

    const sigBtn = page.getByRole('button', { name: /continuă la semnătură/i });
    await sigBtn.waitFor({ state: 'visible', timeout: 180000 });
    for (let i = 0; i < 180; i++) {
      if (await sigBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    const preReport = await readState(page);
    screeningId = preReport.pdfScreeningId ?? preReport.wfScreeningId;
    mark('pdf_generation', Boolean(preReport.pdfBytes) && (await sigBtn.isEnabled()), `${preReport.pdfBytes ?? 0} bytes`);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    for (let i = 0; i < 120; i++) {
      if (await sigBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(500);
    }
    const reportRefresh = await readState(page);
    mark('refresh_report', reportRefresh.path === '/screening/report' && Boolean(reportRefresh.pdfBytes || reportRefresh.pdfFilename),
      JSON.stringify({ path: reportRefresh.path, pdf: reportRefresh.pdfBytes, fn: reportRefresh.pdfFilename }));

    await sigBtn.click();
    await page.waitForURL('**/screening/signature', { timeout: 20000 });
    const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
    await canvas.waitFor({ state: 'visible', timeout: 10000 });
    let canvasWidth = 0;
    for (let i = 0; i < 20; i++) {
      const box = await canvas.boundingBox();
      canvasWidth = box?.width ?? 0;
      if (canvasWidth > 10) break;
      await page.waitForTimeout(250);
    }
    const sigState = await readState(page);
    mark('continua_semnatura', sigState.path === '/screening/signature', sigState.path);
    mark('signature_canvas', sigState.sigHeading && canvasWidth > 10, `w=${canvasWidth}`);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const sigRefresh = await readState(page);
    mark('refresh_signature', sigRefresh.path === '/screening/signature' && sigRefresh.sigHeading && sigRefresh.canvas.w > 10,
      JSON.stringify(sigRefresh));

    const box = await canvas.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 40, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2, { steps: 12 });
      await page.mouse.up();
    }
    mark('signature_draw', Boolean(box && box.width > 10), 'drew stroke');

    await page.getByRole('button', { name: /salvează semnătura/i }).click();
    await page.waitForURL('**/screening/complete', { timeout: 30000 });
    await page.getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i).waitFor({ timeout: 120000 });
    mark('signature_save', true, 'saved');
    mark('complete_screening', page.url().includes('/screening/complete'), page.url());
    mark('completion_page', page.url().includes('/screening/complete') && (await page.getByText(/screening finalizat/i).first().isVisible().catch(() => false)), page.url());

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    await page.getByText(/screening finalizat/i).first().waitFor({ state: 'visible', timeout: 30000 });
    const completeRefresh = await readState(page);
    mark('refresh_complete', completeRefresh.path === '/screening/complete' && completeRefresh.completeHeading,
      JSON.stringify(completeRefresh));
    mark('generatedPdf_survives_refresh', Boolean(completeRefresh.pdfBytes), `${completeRefresh.pdfBytes}`);
    mark('resolvedPdf_survives_refresh', completeRefresh.path === '/screening/complete' && Boolean(completeRefresh.pdfBytes), completeRefresh.pdfKey ?? '');
    mark('activePatient_survives_refresh', completeRefresh.participantBanner && completeRefresh.wfPatient?.includes('Ion'), completeRefresh.wfPatient ?? '');
    mark('participantSignature_survives_refresh', Boolean(completeRefresh.sigName), completeRefresh.sigName ?? '');
    mark('storage_context_sync', Boolean(completeRefresh.pdfBytes && completeRefresh.sigName && completeRefresh.wfPatient),
      `pdf=${completeRefresh.pdfKey} sig=${completeRefresh.sigKey}`);

    await page.getByText(/livrare raport/i).waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('#delivery-email').waitFor({ state: 'visible', timeout: 30000 });
    await page.fill('#delivery-email', EMAIL_TO);
    const emailBtn = page.getByRole('button', { name: /trimite pe email|se verifică emailul/i });
    for (let i = 0; i < 90; i++) {
      if (await emailBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    await page.getByRole('button', { name: /trimite pe email/i }).click();
    await page.getByText(/email trimis cu succes/i).waitFor({ timeout: 120000 });
    const emailMsg = await page.locator('[role="status"]').last().textContent().catch(() => '');
    mark('email_send', /email trimis cu succes/i.test(emailMsg ?? ''), emailMsg?.slice(0, 80) ?? '');

    screeningId = screeningId ?? completeRefresh.wfScreeningId ?? completeRefresh.pdfScreeningId;
    if (screeningId && authToken) {
      const reportRes = await fetch(`${API}/screenings/${screeningId}/report`, {
        headers: { Authorization: `Bearer ${authToken}`, Accept: 'application/json' },
      });
      const reportJson = await reportRes.json();
      const participantReport = reportJson?.data?.participant_report;
      const reportUrl = participantReport?.qr?.url;
      let opened = false;
      if (reportUrl) {
        const rp = await context.newPage();
        const nav = await rp.goto(reportUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        opened = (nav?.status() ?? 500) < 400;
        await rp.close();
      }
      const apiReportOk = reportRes.ok && Boolean(participantReport?.metadata?.report_id);
      mark('report_reopen', apiReportOk && (opened || Boolean(reportUrl)), reportUrl ?? `HTTP ${reportRes.status}`);
    } else {
      mark('report_reopen', false, 'missing id/token');
    }

    mark('no_console_errors', consoleErrors.length === 0, consoleErrors.join(' | ').slice(0, 200));
    mark('no_react_errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));
    mark('no_network_errors', networkFails.length === 0, networkFails.join(' | ').slice(0, 200));
  } catch (err) {
    checks._error = { pass: false, detail: err?.message ?? String(err) };
  } finally {
    await browser.close();
  }

  const pass = Object.entries(checks)
    .filter(([k]) => !k.startsWith('_'))
    .every(([, c]) => c.pass) && !checks._error;
  return { runIndex, pass, checks, screeningId, errors: { console: consoleErrors, react: pageErrors, network: networkFails } };
}

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LOGIN_EMAIL, password: LOGIN_PASSWORD }),
  });
  const loginJson = await loginRes.json();
  const authToken = loginJson?.data?.token ?? null;

  const results = [];
  for (let i = 1; i <= 3; i++) {
    results.push(await runOnce(i, authToken));
    if (i < 3) await sleep(65000);
  }

  const out = {
    allPass: results.every((r) => r.pass),
    results,
    errors: {
      console: results.flatMap((r) => r.errors?.console ?? []),
      react: results.flatMap((r) => r.errors?.react ?? []),
      network: results.flatMap((r) => r.errors?.network ?? []),
    },
  };
  await writeFile(path.join(ROOT, 'tmp-verify-3x-results.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.allPass ? 0 : 1);
}

main();
