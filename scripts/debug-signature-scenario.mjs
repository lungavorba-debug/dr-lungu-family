/** Single scenario runner: A=refresh report, B=refresh signature, D=complete+reload */
import { chromium } from 'playwright';
const WEB = 'http://127.0.0.1:5173';
const scenario = process.argv[2] || 'A';

async function readState(page, tag) {
  return page.evaluate((label) => {
    const pdfKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
    const wfKeys = Object.keys(localStorage).filter((k) => k.startsWith('medscreen_screening_workflow:'));
    const pdf = pdfKeys[0] ? JSON.parse(sessionStorage.getItem(pdfKeys[0]) ?? '{}') : null;
    let wfEvalId = null, wfHasPatient = false, wfHasEval = false;
    if (wfKeys[0]) {
      const wf = JSON.parse(localStorage.getItem(wfKeys[0]) ?? '{}');
      wfEvalId = wf?.clinicalEvaluation?.screening_id ?? null;
      wfHasPatient = Boolean(wf?.activePatient);
      wfHasEval = Boolean(wf?.clinicalEvaluation);
    }
    const canvas = document.querySelector('canvas[aria-label="Zonă de semnătură participant"]');
    const box = canvas?.getBoundingClientRect?.();
    return {
      label, url: location.href,
      wfKeys, wfEvalId, wfHasPatient, wfHasEval,
      pdfKey: pdfKeys[0] ?? null,
      pdfScreeningId: pdf?.screening_id ?? null,
      pdfBytes: pdf?.byte_length ?? null,
      pdfGenVersion: pdf?.generator_version ?? null,
      pdfFilenameOnPage: document.body.innerText.match(/[\w-]+\.pdf\s·/)?.[0] ?? null,
      sigHeading: /Semnătură participant/i.test(document.body.innerText),
      completeHeading: document.body.innerText.includes('Screening finalizat'),
      hydrating: document.body.innerText.includes('Se restaurează sesiunea de screening'),
      canvas: { exists: Boolean(canvas), w: box?.width ?? 0 },
      bodyHead: document.body.innerText.slice(0, 400),
    };
  }, tag);
}

async function login(page) {
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
  await page.fill('input[type="email"]', 'admin@medscreen.ro');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 60000 });
  if (page.url().includes('/campaigns/select')) await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
}

async function toReport(page) {
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /screening nou/i }).first().click();
  await page.waitForURL('**/screening');
  const phone = `07${String(Date.now()).slice(-8)}`;
  await page.fill('#conversation-field-first_name', 'Ion');
  await page.fill('#conversation-field-last_name', 'Live');
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
  const c = page.getByRole('button', { name: /confirmă și continuă/i });
  if (await c.isVisible().catch(() => false)) await c.click();
  await page.waitForURL('**/screening/results');
  await page.getByRole('button', { name: /raport pentru participant/i }).click();
  await page.waitForURL('**/screening/report');
  const btn = page.getByRole('button', { name: /continuă la semnătură/i });
  for (let i = 0; i < 180; i++) { if (await btn.isEnabled().catch(() => false)) break; await page.waitForTimeout(1000); }
  return btn;
}

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [], pageErrors = [], networkFails = [];
page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', e => pageErrors.push(e.message));
page.on('response', r => { if (r.url().includes('/api/v1/') && r.status() >= 400) networkFails.push({ url: r.url(), status: r.status() }); });

let out = { scenario, consoleErrors, pageErrors, networkFails };

try {
  await login(page);
  const btn = await toReport(page);
  const pre = await readState(page, 'pre');

  if (scenario === 'A') {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const postReload = await readState(page, 'post_reload');
    const btn2 = page.getByRole('button', { name: /continuă la semnătură/i });
    for (let i = 0; i < 120; i++) { if (await btn2.isEnabled().catch(() => false)) break; await page.waitForTimeout(1000); }
    await btn2.click();
    await page.waitForTimeout(2500);
    const postClick = await readState(page, 'post_click');
    out = { ...out, pre, postReload, postClick, pass: postClick.url.includes('/screening/signature') && postClick.sigHeading };
  }

  if (scenario === 'B') {
    await btn.click();
    await page.waitForURL('**/screening/signature');
    const onSig = await readState(page, 'on_signature');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const postReload = await readState(page, 'post_reload_signature');
    out = { ...out, onSig, postReload, pass: postReload.url.includes('/screening/signature') && postReload.sigHeading };
  }

  if (scenario === 'D') {
    await btn.click();
    await page.waitForURL('**/screening/signature');
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
    await page.waitForTimeout(2000);
    const onComplete = await readState(page, 'on_complete');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const postReload = await readState(page, 'complete_reload');
    out = { ...out, onComplete, postReload, pass: postReload.url.includes('/screening/complete') };
  }
} catch (e) {
  out.error = e instanceof Error ? e.message : String(e);
  out.pass = false;
  out.finalState = await readState(page, 'error_state').catch(() => null);
}

console.log(JSON.stringify(out, null, 2));
await browser.close();
process.exit(out.pass ? 0 : 1);
