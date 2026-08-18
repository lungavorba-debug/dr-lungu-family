/**
 * Live signature failure scenarios — refresh / direct URL / complete flow.
 */
import { chromium } from 'playwright';

const WEB = process.env.WEB_URL ?? 'http://127.0.0.1:5173';
const results = [];

function log(scenario, data) {
  results.push({ scenario, ts: new Date().toISOString(), ...data });
}

async function readState(page, tag) {
  return page.evaluate((label) => {
    const pdfKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('medscreen_screening_pdf:'));
    const wfKeys = Object.keys(localStorage).filter((k) => k.startsWith('medscreen_screening_workflow:'));
    const pdf = pdfKeys[0] ? JSON.parse(sessionStorage.getItem(pdfKeys[0]) ?? '{}') : null;
    let wfEvalId = null;
    let wfHasPatient = false;
    if (wfKeys[0]) {
      try {
        const wf = JSON.parse(localStorage.getItem(wfKeys[0]) ?? '{}');
        wfEvalId = wf?.clinicalEvaluation?.screening_id ?? null;
        wfHasPatient = Boolean(wf?.activePatient);
      } catch {}
    }
    const canvas = document.querySelector('canvas[aria-label="Zonă de semnătură participant"]');
    const box = canvas?.getBoundingClientRect?.();
    return {
      label,
      url: location.href,
      wfKeys,
      wfEvalId,
      wfHasPatient,
      pdfKey: pdfKeys[0] ?? null,
      pdfScreeningId: pdf?.screening_id ?? null,
      pdfBytes: pdf?.byte_length ?? null,
      pdfFilenameOnPage: document.body.innerText.match(/[\w-]+\.pdf\s·/)?.[0] ?? null,
      sigHeading: document.body.innerText.includes('Semnătură participant'),
      completeHeading: document.body.innerText.includes('Screening finalizat'),
      hydrating: document.body.innerText.includes('Se restaurează sesiunea de screening'),
      canvas: { exists: Boolean(canvas), w: box?.width ?? 0, h: box?.height ?? 0 },
      bodyHead: document.body.innerText.slice(0, 300),
    };
  }, tag);
}

async function runScreeningToReport(page) {
  await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
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
  for (const [field, val] of Object.entries({
    systolic_bp: '120', diastolic_bp: '80', pulse: '72', oxygen_saturation: '98',
    blood_glucose: '95', weight_kg: '80', height_cm: '178', waist_circumference_cm: '90',
  })) await page.locator(`#${field}`).fill(val);
  await page.getByRole('button', { name: /A jeun/i }).click();
  await page.getByRole('button', { name: /salvează măsurătorile/i }).click();
  const confirm = page.getByRole('button', { name: /confirmă și continuă/i });
  if (await confirm.isVisible().catch(() => false)) await confirm.click();
  await page.waitForURL('**/screening/results');
  await page.getByRole('button', { name: /raport pentru participant/i }).click();
  await page.waitForURL('**/screening/report');
  const btn = page.getByRole('button', { name: /continuă la semnătură/i });
  await btn.waitFor({ timeout: 180000 });
  for (let i = 0; i < 180; i++) {
    if (await btn.isEnabled().catch(() => false)) break;
    await page.waitForTimeout(1000);
  }
  return btn;
}

async function loginClean(page) {
  await page.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
  await page.fill('input[type="email"]', 'admin@medscreen.ro');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns)/, { timeout: 30000 });
  if (page.url().includes('/campaigns/select')) {
    await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const consoleErrors = [];
  const pageErrors = [];
  const networkFails = [];

  // Scenario A: refresh on report then click signature
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('response', (r) => {
      if (r.url().includes('/api/v1/') && r.status() >= 400) networkFails.push({ url: r.url(), status: r.status() });
    });

    await loginClean(page);
    const btn = await runScreeningToReport(page);
    const beforeReload = await readState(page, 'A_before_reload');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const afterReload = await readState(page, 'A_after_reload');
    const btnAfter = page.getByRole('button', { name: /continuă la semnătură/i });
    let btnEnabled = false;
    for (let i = 0; i < 60; i++) {
      if (await btnAfter.isEnabled().catch(() => false)) { btnEnabled = true; break; }
      await page.waitForTimeout(1000);
    }
    if (btnEnabled) await btnAfter.click();
    await page.waitForTimeout(2000);
    const afterClick = await readState(page, 'A_after_click');
    log('A_refresh_report_then_signature', {
      beforeReload,
      afterReload,
      btnEnabledAfterReload: btnEnabled,
      afterClick,
      pass: afterClick.url.includes('/screening/signature') && afterClick.sigHeading,
      redirectReason: afterClick.url.includes('/screening/report') ? 'bounced to report after reload+click' : null,
    });
    await ctx.close();
  }

  // Scenario B: navigate to signature, then hard refresh on signature page
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => pageErrors.push(e.message));

    await loginClean(page);
    const btn = await runScreeningToReport(page);
    await btn.click();
    await page.waitForURL('**/screening/signature');
    const onSig = await readState(page, 'B_on_signature');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const afterReload = await readState(page, 'B_after_reload_signature');
    log('B_refresh_on_signature_page', {
      onSig,
      afterReload,
      pass: afterReload.url.includes('/screening/signature') && afterReload.sigHeading,
      redirectReason: afterReload.url.includes('/screening/report')
        ? `redirect to report — hydrating=${afterReload.hydrating} pdf=${Boolean(afterReload.pdfScreeningId)} wfEval=${afterReload.wfEvalId}`
        : null,
    });
    await ctx.close();
  }

  // Scenario C: direct URL /screening/signature with only stored artifacts (no SPA context)
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await loginClean(page);
    const btn = await runScreeningToReport(page);
    const stash = await page.evaluate(() => ({
      pdf: Object.fromEntries(Object.keys(sessionStorage).filter(k => k.startsWith('medscreen_screening_pdf:')).map(k => [k, sessionStorage.getItem(k)])),
      wf: Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('medscreen_screening_workflow:')).map(k => [k, localStorage.getItem(k)])),
    }));
    await ctx.close();

    const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page2 = await ctx2.newPage();
    page2.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    await loginClean(page2);
    await page2.evaluate((data) => {
      for (const [k, v] of Object.entries(data.pdf)) sessionStorage.setItem(k, v);
      for (const [k, v] of Object.entries(data.wf)) localStorage.setItem(k, v);
    }, stash);
    await page2.goto(`${WEB}/screening/signature`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(2500);
    const state = await readState(page2, 'C_direct_signature_url');
    log('C_direct_signature_url_restored_storage', {
      state,
      pass: state.url.includes('/screening/signature') && state.sigHeading,
      redirectReason: state.url.includes('/screening/report') ? 'direct URL guard failed' : null,
    });
    await ctx2.close();
  }

  // Scenario D: full save signature -> complete page
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => pageErrors.push(e.message));
    page.on('response', (r) => {
      if (r.url().includes('/api/v1/') && r.status() >= 400) networkFails.push({ url: r.url(), status: r.status() });
    });

    await loginClean(page);
    const btn = await runScreeningToReport(page);
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
    await page.waitForTimeout(1500);
    const onCompleteFixed = await readState(page, 'D_on_complete');
    log('D_save_signature_to_complete', {
      onComplete: onCompleteFixed,
      pass: onCompleteFixed.url.includes('/screening/complete') && onCompleteFixed.completeHeading,
      redirectReason: onCompleteFixed.url.includes('/screening/signature')
        ? 'complete page redirected back to signature — missing participantSignature or generatedPdf'
        : onCompleteFixed.url.includes('/screening/report')
          ? 'complete page redirected to report — missing generatedPdf in context'
          : null,
    });

    // Scenario D2: refresh on complete page
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const afterCompleteReload = await readState(page, 'D_after_complete_reload');
    log('D2_refresh_on_complete', {
      afterCompleteReload,
      pass: afterCompleteReload.url.includes('/screening/complete'),
      redirectReason: !afterCompleteReload.url.includes('/screening/complete')
        ? `after refresh landed on ${afterCompleteReload.url}`
        : null,
    });
    await ctx.close();
  }

  console.log(JSON.stringify({ results, consoleErrors, pageErrors, networkFails }, null, 2));
  const anyFail = results.some((r) => r.pass === false);
  process.exit(anyFail ? 1 : 0);
}

main();
