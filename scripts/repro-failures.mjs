/** Reproduce failure modes: completed reload, stale workflow */
import { chromium } from 'playwright';

const WEB = 'http://127.0.0.1:5173';

async function fullFlowToComplete(page) {
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /screening nou/i }).first().click();
  await page.waitForURL('**/screening');
  const phone = `07${String(Date.now()).slice(-8)}`;
  await page.fill('#conversation-field-first_name', 'Ion');
  await page.fill('#conversation-field-last_name', 'Fix');
  await page.fill('#conversation-field-phone', phone);
  await page.fill('#conversation-field-age', '45');
  await page.getByRole('button', { name: 'Masculin' }).click();
  await page.getByRole('button', { name: 'Pitești' }).click();
  await page.getByRole('button', { name: /continuă la întrebări screening/i }).click();
  await page.waitForURL('**/screening/anamnesis');
  await page.getByRole('button', { name: /continuă la măsurători/i }).click();
  await page.waitForURL('**/screening/measurements');
  for (const [f,v] of Object.entries({systolic_bp:'120',diastolic_bp:'80',pulse:'72',oxygen_saturation:'98',blood_glucose:'95',weight_kg:'80',height_cm:'178',waist_circumference_cm:'90'}))
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
  await btn.click();
  await page.waitForURL('**/screening/signature');
  const canvas = page.locator('canvas[aria-label="Zonă de semnătură participant"]');
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x+40, box.y+box.height/2);
    await page.mouse.down();
    await page.mouse.move(box.x+box.width-40, box.y+box.height/2, {steps:8});
    await page.mouse.up();
  }
  await page.getByRole('button', { name: /salvează semnătura/i }).click();
  await page.waitForURL('**/screening/complete');
  await page.getByText(/screeningul a fost salvat pe server|screeningul era deja salvat/i).waitFor({ timeout: 120000 });
}

async function state(page) {
  return page.evaluate(() => ({
    url: location.pathname,
    is_completed: JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k=>k.startsWith('medscreen_screening_workflow:')) ?? 'null') || 'null')?.is_completed ?? null,
    complete: document.body.innerText.includes('Screening finalizat'),
    sig: document.body.innerText.includes('Semnătură participant'),
    report: document.body.innerText.includes('Raport participant'),
  }));
}

const browser = await chromium.launch({ headless: true });
const results = [];

// FAIL MODE: reload complete AFTER persist
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
  await page.fill('input[type="email"]', 'admin@medscreen.ro');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 60000 });
  if (page.url().includes('/campaigns/select')) await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
  await fullFlowToComplete(page);
  const before = await state(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const after = await state(page);
  results.push({ test: 'reload_complete_after_persist', before, after, pass: after.url === '/screening/complete' && after.complete });
  await ctx.close();
}

// FAIL MODE: stale is_completed, start new screening without clearSession - go to /screening directly
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { sessionStorage.clear(); localStorage.clear(); });
  await page.fill('input[type="email"]', 'admin@medscreen.ro');
  await page.fill('input[type="password"]', 'Admin123!');
  await page.getByRole('button', { name: /autentificare/i }).click();
  await page.waitForURL(/\/($|campaigns|dashboard)/, { timeout: 60000 });
  if (page.url().includes('/campaigns/select')) await page.getByRole('button', { name: /continuă/i }).click().catch(() => {});
  await fullFlowToComplete(page);
  // Don't clear - navigate to dashboard then screening nou via URL only (simulate bookmark)
  await page.goto(`${WEB}/screening`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const stale = await state(page);
  results.push({ test: 'stale_completed_visit_screening', stale, pass: stale.url === '/screening' || stale.url === '/screening/complete' });
  await ctx.close();
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
process.exit(results.every(r => r.pass) ? 0 : 1);
