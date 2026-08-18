/**
 * UI verification for Ideal Weight on Measurements page.
 * Run: node apps/web/scripts/verify-ideal-weight-ui.mjs
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.MEDSCREEN_URL ?? 'http://localhost:5174';
const API = `${BASE}/api/v1`;
const EMAIL = process.env.MEDSCREEN_EMAIL ?? 'admin@medscreen.ro';
const PASSWORD = process.env.MEDSCREEN_PASSWORD ?? 'Admin123!';

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json)}`);
  return json.data;
}

function emptyAnamnesis() {
  return {
    chief_complaint: '',
    symptoms: '',
    medical_history: '',
    medications: '',
    allergies: '',
    smoking_status: '',
    alcohol_consumption: '',
    family_history: '',
    lifestyle: '',
    risk_factors: '',
    known_hypertension: null,
    known_diabetes: null,
    chest_pain: 'none',
    dyspnea: null,
    snoring: null,
    follows_treatment: null,
    current_treatment: '',
    free_notes: '',
    clinical_summary: '',
  };
}

async function main() {
  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
  });

  const token = login.token;
  const user = login.user;
  const { campaigns } = await api('/campaigns', { token });
  const campaign = campaigns.find((c) => c.is_active) ?? campaigns[0];
  if (!campaign) throw new Error('No campaign available');

  const ts = Date.now();
  const { patient } = await api('/patients', {
    method: 'POST',
    token,
    body: {
      first_name: 'Test',
      last_name: 'Idealweight',
      phone: `0722${String(ts % 1000000).padStart(6, '0')}`,
      age: 45,
      gender: 'M',
      city: 'Corbeni',
    },
  });

  const workflow = {
    version: 2,
    is_completed: false,
    activePatient: patient,
    anamnesis: emptyAnamnesis(),
    aiSessionId: null,
    measurements: null,
    clinicalEngineInput: null,
    clinicalEvaluation: null,
    measurementsDraft: null,
    updated_at: new Date().toISOString(),
  };

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const report = {
    fieldVisible: false,
    labelText: null,
    valueText: null,
    displaysValue: false,
    heightUpdateWorks: false,
    sexUpdateWorks: false,
    bmiVisible: false,
    bmiValue: null,
    hiddenByCss: false,
    outsideLayout: false,
    renderedButEmpty: false,
    componentMounted: false,
    inViewport: false,
    computedStyle: null,
    pageUrl: null,
    bodyContainsIdealWeightLabel: false,
    distHasIdealWeight: false,
    errors: [],
  };

  try {
    await page.addInitScript(
      ({ tokenValue, userValue, userId, campaignId, workflowValue }) => {
        localStorage.setItem('medscreen_token', tokenValue);
        localStorage.setItem('medscreen_user', JSON.stringify(userValue));
        sessionStorage.setItem(`medscreen_active_campaign:${userId}`, campaignId);
        localStorage.setItem(`medscreen_screening_workflow:${userId}`, JSON.stringify(workflowValue));
      },
      {
        tokenValue: token,
        userValue: user,
        userId: user.id,
        campaignId: campaign.id,
        workflowValue: workflow,
      },
    );

    await page.goto(`${BASE}/screening/measurements`, { waitUntil: 'networkidle', timeout: 60000 });
    report.pageUrl = page.url();
    report.bodyContainsIdealWeightLabel = (await page.locator('body').innerText()).includes('Greutate ideală');

    const idealField = page.getByText('Greutate ideală', { exact: false }).first();
    report.fieldVisible = (await idealField.count()) > 0;
    report.componentMounted = report.fieldVisible;

    if (report.fieldVisible) {
      report.labelText = (await idealField.textContent())?.trim() ?? null;
      const idealBox = page.locator('text=Greutate ideală').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');
      const valueEl = idealBox.locator('p.tabular-nums').last();

      await page.locator('#height_cm').fill('180');
      await page.locator('#weight_kg').fill('90');
      await page.waitForTimeout(700);

      report.valueText = (await valueEl.textContent())?.trim() ?? null;
      report.displaysValue =
        report.valueText != null && !report.valueText.includes('—') && /\d/.test(report.valueText);
      report.renderedButEmpty =
        report.valueText === '—' || report.valueText === '' || report.valueText === null;

      report.bmiVisible = (await page.getByText('BMI', { exact: false }).count()) > 0;
      report.bmiValue = (
        await page
          .getByText('BMI', { exact: false })
          .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
          .locator('p.tabular-nums')
          .last()
          .textContent()
      )?.trim();

      const valueAt180 = report.valueText;
      await page.locator('#height_cm').fill('170');
      await page.waitForTimeout(700);
      const valueAt170 = (await valueEl.textContent())?.trim() ?? null;
      report.heightUpdateWorks =
        valueAt170 !== valueAt180 && valueAt170 != null && !valueAt170.includes('—');

      const femalePatient = { ...patient, gender: 'F' };
      const femaleWorkflow = { ...workflow, activePatient: femalePatient };
      await page.evaluate(
        ({ userId, femaleWorkflowValue }) => {
          localStorage.setItem(`medscreen_screening_workflow:${userId}`, JSON.stringify(femaleWorkflowValue));
        },
        { userId: user.id, femaleWorkflowValue: femaleWorkflow },
      );
      await page.reload({ waitUntil: 'networkidle' });
      await page.locator('#height_cm').fill('180');
      await page.waitForTimeout(700);
      const femaleValue = (
        await page
          .locator('text=Greutate ideală')
          .locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]')
          .locator('p.tabular-nums')
          .last()
          .textContent()
      )?.trim();
      report.sexUpdateWorks =
        femaleValue !== valueAt180 && femaleValue != null && !femaleValue.includes('—');

      await page.locator('#height_cm').fill('180');
      await page.locator('#weight_kg').fill('90');
      await page.waitForTimeout(400);

      const box = await idealBox.boundingBox();
      report.inViewport = box != null && box.y >= 0 && box.y < 900 && box.width > 0 && box.height > 0;
      report.outsideLayout = box == null || box.width === 0 || box.height === 0;

      report.computedStyle = await idealBox.evaluate((el) => {
        const s = getComputedStyle(el);
        return {
          display: s.display,
          visibility: s.visibility,
          opacity: s.opacity,
          height: s.height,
          width: s.width,
        };
      });
      report.hiddenByCss =
        report.computedStyle.display === 'none' ||
        report.computedStyle.visibility === 'hidden' ||
        Number.parseFloat(report.computedStyle.opacity) === 0;
    }

    await page.screenshot({
      path: 'apps/web/scripts/verify-ideal-weight-ui.png',
      fullPage: true,
    });
  } catch (error) {
    report.errors.push(String(error));
    await page
      .screenshot({
        path: 'apps/web/scripts/verify-ideal-weight-ui-error.png',
        fullPage: true,
      })
      .catch(() => {});
    report.pageUrl = page.url();
    report.bodyContainsIdealWeightLabel = (await page.locator('body').innerText().catch(() => '')).includes(
      'Greutate ideală',
    );
  } finally {
    await browser.close();
  }

  try {
    const distRes = await fetch(`${BASE.replace('5174', '4173')}/`);
    report.distHasIdealWeight = distRes.ok;
  } catch {
    report.distHasIdealWeight = false;
  }

  writeFileSync('apps/web/scripts/verify-ideal-weight-ui-report.json', JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.displaysValue ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
