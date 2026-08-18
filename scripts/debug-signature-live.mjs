/**
 * Live signature flow debugger — clean session, full capture.
 * Usage: node scripts/debug-signature-live.mjs
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';

const trace = [];
const consoleLog = [];
const networkLog = [];
const pageErrors = [];

function record(step, data) {
  trace.push({ step, ts: new Date().toISOString(), ...data });
}

async function readBrowserState(page, label) {
  return page.evaluate((tag) => {
    const pdfKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
    const sigKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_signature:'));
    const workflowKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_workflow:'));

    const pdfEntries = pdfKeys.map((key) => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return { key, present: false };
      try {
        const parsed = JSON.parse(raw);
        return {
          key,
          present: true,
          screening_id: parsed.screening_id ?? null,
          filename: parsed.filename ?? null,
          byte_length: parsed.byte_length ?? null,
          generator_version: parsed.generator_version ?? null,
          base64_length: parsed.base64?.length ?? 0,
        };
      } catch {
        return { key, present: true, parse_error: true };
      }
    });

    let workflowScreeningId = null;
    let workflowHasEvaluation = false;
    if (workflowKeys[0]) {
      try {
        const wf = JSON.parse(sessionStorage.getItem(workflowKeys[0]) ?? '{}');
        workflowScreeningId = wf?.clinicalEvaluation?.screening_id ?? wf?.clinicalEngineInput?.screening_id ?? null;
        workflowHasEvaluation = Boolean(wf?.clinicalEvaluation);
      } catch {
        // ignore
      }
    }

    const canvas = document.querySelector('canvas[aria-label="Zonă de semnătură participant"]');
    const canvasBox = canvas?.getBoundingClientRect?.();
    const pdfFilenameOnPage = document.body.innerText.match(/[\w-]+\.pdf\s·/)?.[0] ?? null;
    const hydratingText = document.body.innerText.includes('Se restaurează sesiunea de screening');
    const sigHeading = Boolean(document.querySelector('h1')?.textContent?.includes('Semnătură participant'));

    return {
      label: tag,
      url: location.href,
      pathname: location.pathname,
      hydratingText,
      sigHeading,
      canvas: {
        exists: Boolean(canvas),
        width: canvasBox?.width ?? 0,
        height: canvasBox?.height ?? 0,
      },
      sessionStorage: {
        pdfEntries,
        sigKeys,
        workflowKeys,
        workflowScreeningId,
        workflowHasEvaluation,
      },
      pdfFilenameOnPage,
      bodySnippet: document.body.innerText.slice(0, 800),
    };
  }, label);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: undefined,
  });
  await context.clearCookies();
  const page = await context.newPage();

  page.on('console', (msg) => {
    consoleLog.push({ type: msg.type(), text: msg.text() });
  });
  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
  });
  page.on('request', (req) => {
    const url = req.url();
    if (url.includes('/api/v1/')) {
      networkLog.push({ phase: 'request', method: req.method(), url });
    }
  });
  page.on('response', async (res) => {
    const url = res.url();
    if (!url.includes('/api/v1/')) return;
    networkLog.push({
      phase: 'response',
      method: res.request().method(),
      url,
      status: res.status(),
    });
  });

  const navEvents = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navEvents.push({ url: frame.url(), ts: Date.now() });
    }
  });

  try {
    // Clean session
    await page.goto(`${WEB}/login`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.clear();
    });
    record('clean_session', { pass: true, detail: 'sessionStorage + localStorage cleared' });

    await page.fill('input[type="email"]', 'admin@medscreen.ro');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.getByRole('button', { name: /autentificare/i }).click();
    await page.waitForURL(/\/($|campaigns)/, { timeout: 30000 });
    if (page.url().includes('/campaigns/select')) {
      await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
      await page.waitForURL(/\//, { timeout: 15000 }).catch(() => {});
    }
    record('login', { pass: true, url: page.url() });

    // Step 1 — Open screening
    await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /screening nou/i }).first().click();
    await page.waitForURL('**/screening', { timeout: 30000 });
    const phone = `07${String(Date.now()).slice(-8)}`;
    await page.fill('#conversation-field-first_name', 'Ion');
    await page.fill('#conversation-field-last_name', 'Debug');
    await page.fill('#conversation-field-phone', phone);
    await page.fill('#conversation-field-age', '45');
    await page.getByRole('button', { name: 'Masculin' }).click();
    await page.getByRole('button', { name: 'Pitești' }).click();
    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis', { timeout: 30000 });
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements', { timeout: 30000 });
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
    await page.waitForURL('**/screening/results', { timeout: 60000 });
    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report', { timeout: 30000 });
    record('open_screening', { pass: true, url: page.url(), state: await readBrowserState(page, 'report_loaded') });

    // Step 2 — Generate report / wait for PDF
    const continueBtn = page.getByRole('button', { name: /continuă la semnătură/i });
    await continueBtn.waitFor({ state: 'visible', timeout: 180000 });
    for (let i = 0; i < 180; i++) {
      if (await continueBtn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    const pdfReady = await continueBtn.isEnabled();
    const reportState = await readBrowserState(page, 'pdf_ready');
    record('generate_report', {
      pass: pdfReady,
      continueButtonEnabled: pdfReady,
      state: reportState,
      pdfApiCalls: networkLog.filter((n) => n.url?.includes('/participant/pdf/generate')),
    });

    // Step 3 — Click Continuă la semnătură
    const urlBefore = page.url();
    const stateBeforeClick = await readBrowserState(page, 'before_signature_click');
    await continueBtn.click();
    await page.waitForTimeout(300);
    const urlImmediate = page.url();
    await page.waitForTimeout(2000);
    const urlAfter2s = page.url();
    const stateAfterClick = await readBrowserState(page, 'after_signature_click');

    let redirectReason = null;
    if (urlAfter2s.includes('/screening/report') && urlBefore.includes('/screening/report')) {
      if (stateAfterClick.hydratingText) redirectReason = 'isHydrating=true (loading screen)';
      else if (!stateAfterClick.sessionStorage.workflowHasEvaluation) redirectReason = 'missing clinicalEvaluation';
      else if (!stateAfterClick.sessionStorage.pdfEntries.some((e) => e.present)) redirectReason = 'resolvedPdf=null: no PDF in sessionStorage';
      else if (stateAfterClick.sessionStorage.pdfEntries.some((e) => e.present && !e.screening_id)) redirectReason = 'PDF in storage but missing screening_id';
      else if (
        stateAfterClick.sessionStorage.workflowScreeningId &&
        stateAfterClick.sessionStorage.pdfEntries[0]?.screening_id &&
        stateAfterClick.sessionStorage.workflowScreeningId !== stateAfterClick.sessionStorage.pdfEntries[0]?.screening_id
      ) {
        redirectReason = `screening_id mismatch: workflow=${stateAfterClick.sessionStorage.workflowScreeningId} pdf=${stateAfterClick.sessionStorage.pdfEntries[0]?.screening_id}`;
      }
      else if (!stateAfterClick.sigHeading && !stateAfterClick.canvas.exists) redirectReason = 'ScreeningSignaturePage guard: !activePatient || !clinicalEvaluation || !resolvedPdf (L112-114)';
      else redirectReason = 'unknown redirect to /screening/report';
    } else if (urlAfter2s.includes('/screening/complete')) {
      redirectReason = 'cached participantSignature exists — Navigate to /screening/complete (L124-128)';
    }

    record('click_signature', {
      pass: urlAfter2s.includes('/screening/signature') && stateAfterClick.sigHeading,
      urlBefore,
      urlImmediate,
      urlAfter2s,
      navEvents,
      stateBeforeClick,
      stateAfterClick,
      redirectReason,
      inferred: {
        generatedPdf_in_context: stateBeforeClick.pdfFilenameOnPage ? 'likely present (filename shown on report page)' : 'not shown on page',
        sessionStorage_pdf: stateAfterClick.sessionStorage.pdfEntries,
        resolvedPdf_would_be: stateAfterClick.sessionStorage.pdfEntries.find((e) => e.present)
          ? 'loadScreeningPdf should return PDF IF screeningId matches key'
          : 'null — loadScreeningPdf returns null',
        screeningId_from_workflow: stateAfterClick.sessionStorage.workflowScreeningId,
      },
    });

    record('canvas_init', {
      pass: stateAfterClick.canvas.exists && stateAfterClick.canvas.width > 10,
      canvas: stateAfterClick.canvas,
      sigHeading: stateAfterClick.sigHeading,
    });

    record('console_errors', {
      errors: consoleLog.filter((c) => c.type === 'error'),
      pageErrors,
    });

    record('network_summary', {
      failed: networkLog.filter((n) => n.phase === 'response' && n.status >= 400),
      pdfGenerate: networkLog.filter((n) => n.url?.includes('pdf/generate')),
    });
  } catch (error) {
    record('fatal', {
      pass: false,
      message: error instanceof Error ? error.message : String(error),
      url: page.url(),
    });
  } finally {
    await browser.close();
  }

  const output = { trace, consoleLog, networkLog, pageErrors };
  const outPath = path.join(ROOT, 'tmp-debug-signature-live.json');
  await writeFile(outPath, JSON.stringify(output, null, 2));
  console.log(JSON.stringify(output, null, 2));
  const failed = trace.some((t) => t.pass === false);
  process.exit(failed ? 1 : 0);
}

main();
