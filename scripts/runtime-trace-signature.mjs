/**
 * Full runtime trace — clean session, signature workflow.
 */
import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WEB = 'http://127.0.0.1:5173';

function storageSnapshot() {
  const pdf = {};
  const sig = {};
  const wf = {};
  for (let i = 0; i < sessionStorage.length; i++) {
    const k = sessionStorage.key(i);
    if (k?.startsWith('medscreen_screening_pdf:')) pdf[k] = sessionStorage.getItem(k)?.length ?? 0;
    if (k?.startsWith('medscreen_screening_signature:')) sig[k] = sessionStorage.getItem(k)?.length ?? 0;
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith('medscreen_')) {
      const raw = localStorage.getItem(k);
      try {
        const parsed = JSON.parse(raw ?? '{}');
        wf[k] = {
          is_completed: parsed.is_completed ?? null,
          screening_id: parsed.clinicalEvaluation?.screening_id ?? parsed.clinicalEngineInput?.screening_id ?? null,
          patient: parsed.activePatient ? `${parsed.activePatient.first_name} ${parsed.activePatient.last_name}` : null,
        };
      } catch {
        wf[k] = { raw_len: raw?.length ?? 0 };
      }
    }
  }
  return { pdf, sig, wf };
}

async function readDom(page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas[aria-label="Zonă de semnătură participant"]');
    const box = canvas?.getBoundingClientRect?.();
    return {
      url: location.href,
      pathname: location.pathname,
      hydrating: document.body.innerText.includes('Se restaurează sesiunea de screening'),
      sigHeading: /Semnătură participant/i.test(document.body.innerText),
      reportHeading: document.body.innerText.includes('Raport participant'),
      completeHeading: document.body.innerText.includes('Screening finalizat'),
      pdfFilename: document.body.innerText.match(/MedScreen-Raport[^\n·]+/)?.[0] ?? null,
      continueBtn: Array.from(document.querySelectorAll('button')).find((b) => /continuă la semnătură/i.test(b.textContent ?? ''))?.disabled ?? null,
      canvas: { exists: Boolean(canvas), w: box?.width ?? 0, h: box?.height ?? 0 },
    };
  });
}

async function main() {
  const trace = { nav: [], console: [], pageErrors: [], rejections: [], polls: [], api: [], bugs: [] };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.clearCookies();
  const page = await context.newPage();

  await page.addInitScript(() => {
    window.__medscreenTrace = window.__medscreenTrace || [];
    const push = (entry) => window.__medscreenTrace.push({ ...entry, ts: Date.now() });
    push({ type: 'init', url: location.href });
    window.addEventListener('error', (e) => push({ type: 'error', message: e.message, stack: e.error?.stack }));
    window.addEventListener('unhandledrejection', (e) => push({ type: 'rejection', reason: String(e.reason) }));
    const wrap = (fn, label) => function (...args) {
      push({ type: label, url: args[2] ?? location.href });
      return fn.apply(this, args);
    };
    history.pushState = wrap(history.pushState, 'pushState');
    history.replaceState = wrap(history.replaceState, 'replaceState');
    window.addEventListener('popstate', () => push({ type: 'popstate', url: location.href }));
  });

  page.on('console', (m) => trace.console.push({ type: m.type(), text: m.text() }));
  page.on('pageerror', (e) => trace.pageErrors.push(e.message));
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/') && r.status() >= 400) {
      trace.api.push({ url: r.url(), status: r.status(), method: r.request().method() });
    }
  });
  page.on('framenavigated', (f) => {
    if (f === page.mainFrame()) trace.nav.push({ url: f.url(), ts: Date.now() });
  });

  const poll = async (label) => {
    const dom = await readDom(page);
    const storage = await page.evaluate(storageSnapshot);
    const injected = await page.evaluate(() => window.__medscreenTrace ?? []).catch(() => []);
    trace.polls.push({ label, dom, storage, injectedTail: injected.slice(-5) });
    return dom;
  };

  try {
    await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); caches?.keys?.().then((ks) => ks.forEach((k) => caches.delete(k))); });
    await poll('after_clean');

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
    await page.fill('#conversation-field-last_name', 'Trace');
    await page.fill('#conversation-field-phone', phone);
    await page.fill('#conversation-field-age', '45');
    await page.getByRole('button', { name: 'Masculin' }).click();
    await page.getByRole('button', { name: 'Pitești' }).click();
    await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
    await page.waitForURL('**/screening/anamnesis');
    await page.getByRole('button', { name: /continuă la măsurători/i }).click();
    await page.waitForURL('**/screening/measurements');
    for (const [f, v] of Object.entries({ systolic_bp:'120', diastolic_bp:'80', pulse:'72', oxygen_saturation:'98', blood_glucose:'95', weight_kg:'80', height_cm:'178', waist_circumference_cm:'90' }))
      await page.locator(`#${f}`).fill(v);
    await page.getByRole('button', { name: /A jeun/i }).click();
    await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
    const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
    await page.waitForURL('**/screening/results');
    await page.getByRole('button', { name: /raport pentru participant/i }).click();
    await page.waitForURL('**/screening/report');

    const btn = page.getByRole('button', { name: /continuă la semnătură/i });
    for (let i = 0; i < 180; i++) {
      if (await btn.isEnabled().catch(() => false)) break;
      await page.waitForTimeout(1000);
    }
    await poll('before_signature_click');

    await btn.click();
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(100);
      await poll(`post_click_${i}`);
      const last = trace.polls[trace.polls.length - 1].dom;
      if (i > 5 && last.pathname === '/screening/report' && !last.sigHeading) {
        trace.bugs.push({ bug: 'BOUNCE_TO_REPORT', at: `post_click_${i}`, dom: last });
        break;
      }
      if (last.pathname === '/screening/signature' && last.sigHeading && last.canvas.exists) break;
    }

    const final = trace.polls[trace.polls.length - 1];
    const signatureOk = final.dom.pathname === '/screening/signature' && final.dom.sigHeading && final.dom.canvas.w > 10;

    if (!signatureOk) {
      trace.bugs.push({ bug: 'SIGNATURE_PAGE_FAILED', final: final.dom, storage: final.storage });
    }

    // Continue full flow: save sig, complete, reload complete
    if (signatureOk) {
      const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
      const box = await canvas.boundingBox();
      if (box) {
        await page.mouse.move(box.x + 40, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width - 40, box.y + box.height / 2, { steps: 8 });
        await page.mouse.up();
      }
      await page.getByRole('button', { name: /salvează semnătura/i }).click();
      await page.waitForURL('**/screening/complete', { timeout: 30000 });
      await poll('on_complete');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);
      const afterReload = await poll('complete_after_reload');
      if (afterReload.pathname !== '/screening/complete') {
        trace.bugs.push({ bug: 'COMPLETE_RELOAD_REDIRECT', landed: afterReload.pathname, storage: trace.polls.at(-1).storage });
      }
    }

    trace.injected = await page.evaluate(() => window.__medscreenTrace ?? []);
    trace.signatureOk = signatureOk;
    trace.pass = trace.bugs.length === 0;
  } catch (e) {
    trace.fatal = e instanceof Error ? e.message : String(e);
    trace.pass = false;
  } finally {
    await browser.close();
  }

  await writeFile(path.join(ROOT, 'tmp-runtime-trace.json'), JSON.stringify(trace, null, 2));
  console.log(JSON.stringify({ pass: trace.pass, bugs: trace.bugs, signatureOk: trace.signatureOk, nav: trace.nav.slice(-8), api: trace.api, pageErrors: trace.pageErrors }, null, 2));
  process.exit(trace.pass ? 0 : 1);
}

main();
