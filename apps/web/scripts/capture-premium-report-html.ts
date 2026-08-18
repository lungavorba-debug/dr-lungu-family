/**
 * Captures a full-page HTML screenshot of the premium Participant Report.
 * Run: npx tsx apps/web/scripts/capture-premium-report-html.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { calculateBmi, calculateIdealWeight } from '../../../packages/shared/src/schemas/measurements.schema.ts';
import { evaluateClinicalEngine } from '../../../packages/shared/src/clinical/engine.ts';
import { composeParticipantReport } from '../../../packages/shared/src/report/composer/compose-participant-report.ts';
import { SECTION_TITLE_MEASUREMENTS, SECTION_TITLE_RECOMMENDATIONS } from '../../../packages/shared/src/report/participant-report.constants.ts';

const outDir = 'apps/web/scripts/ui-screenshots';
mkdirSync(outDir, { recursive: true });

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatUpper(value: string): string {
  return value.toUpperCase();
}

function formatFestivalTitle(name: string): string {
  return formatUpper(name.replace(/^Festivalul\s+/i, ''));
}

function formatSponsorLine(name: string): string {
  const cleaned = name.replace(/^Screening cu sprijinul\s+/i, '').replace(/Comunei\s+/i, '');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function screeningBadgeClass(answer: string): string {
  const normalized = answer.trim();
  if (normalized === 'Nu') return 'bg-emerald-50 text-emerald-800 ring-emerald-200/90';
  if (normalized === 'Da') return 'bg-red-50 text-red-800 ring-red-200/90';
  if (normalized === 'Fost fumător') return 'bg-amber-50 text-amber-900 ring-amber-200/90';
  if (normalized.startsWith('Da —') || normalized.startsWith('Da -')) return 'bg-blue-50 text-blue-800 ring-blue-200/90';
  return 'bg-slate-50 text-slate-700 ring-slate-200/90';
}

function screeningBadge(answer: string): string {
  return `<span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${screeningBadgeClass(answer)}">${escapeHtml(answer)}</span>`;
}

const height = 180;
const weight = 90;
const gender = 'M';
const bmi = calculateBmi(weight, height);
const idealWeight = calculateIdealWeight(height, gender);

const measurements = {
  systolic_bp: 148,
  diastolic_bp: 92,
  pulse: 88,
  oxygen_saturation: 96,
  blood_glucose: 115,
  blood_glucose_status: 'fasting' as const,
  weight_kg: weight,
  height_cm: height,
  bmi,
  ideal_weight_kg: idealWeight,
  waist_circumference_cm: 102,
  known_hypertension: false,
  known_diabetes: false,
  current_antihypertensive_treatment: false,
};

const screeningDisplay = {
  known_hypertension: true,
  known_diabetes: false,
  smoking_status: 'current' as const,
  follows_treatment: true,
  current_treatment: 'Tensiune arterială',
  chest_pain: 'effort' as const,
  dyspnea: true,
  snoring: true,
};

const evaluation = evaluateClinicalEngine({
  clinical_engine_input: {
    screening_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    patient_id: '11111111-2222-3333-4444-555555555555',
    campaign_id: '11111111-1111-4111-8111-111111111111',
    captured_at: '2026-08-04T19:30:00.000Z',
    measurements,
  },
  patient: { age: 45, gender },
  anamnesis: {
    chest_pain: true,
    dyspnea: true,
    snoring: true,
    smoking_status: 'current',
    known_hypertension: true,
    known_diabetes: false,
    current_treatment: 'Tensiune arterială',
    free_notes: '',
    alcohol_consumption: 'none',
  },
});

const report = composeParticipantReport({
  participant: {
    first_name: 'Ion',
    last_name: 'Popescu',
    gender,
    age: 45,
    phone: '0755123456',
    city: 'Corbeni',
  },
  campaign: {
    name: 'Festivalul Tradiții Argeșene',
    edition: 'Ediția a XIII-a',
    description: 'Screening cu sprijinul Primăriei Comunei Corbeni',
    work_point: 'Corbeni',
  },
  screeningDate: '2026-08-04T19:30:00.000Z',
  operatorName: 'Operator Verificare',
  measurements,
  anamnesis: {
    chest_pain: true,
    dyspnea: true,
    snoring: true,
    smoking_status: 'current',
    known_diabetes: false,
    current_treatment: 'Tensiune arterială',
    free_notes: '',
    alcohol_consumption: 'none',
  },
  screening_display: screeningDisplay,
  evaluation,
});

const { copy } = report.layout;
const festivalTitle = formatFestivalTitle(report.event.festival_name);

function partnerPlaceholder(label: string): string {
  return `
    <div class="flex h-[112px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#003D5B]/20 bg-gradient-to-b from-slate-50/90 to-white px-4 text-center">
      <span class="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400">Loc rezervat</span>
      <span class="mt-2 max-w-[160px] text-[10px] font-medium leading-snug text-slate-600">${escapeHtml(label)}</span>
    </div>`;
}

const participantRows = [
  ['Nume', report.participant.last_name],
  ['Prenume', report.participant.first_name],
  ['Vârstă', `${report.participant.age} ani`],
  ['Sex', report.participant.gender_label ?? '—'],
  ['Telefon', report.participant.phone ?? '—'],
  ['Localitate', report.participant.city ?? '—'],
  ['Data screeningului', report.metadata.screening_date.date_line],
  ['Ora', report.metadata.screening_date.time_line],
  ['Campania', report.event.work_point],
  ['Operator', report.footer.operator_name || '—'],
];

const htmlPath = join(outDir, 'participant-report-premium.html');
writeFileSync(
  htmlPath,
  `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = { theme: { extend: { colors: { brand: { primary: '#003D5B', accent: '#38A649' } } } } }
  </script>
  <style>body { font-family: Georgia, 'Times New Roman', serif; background: #f1f5f9; margin: 0; padding: 24px; }</style>
</head>
<body>
  <article id="clinical-report" class="mx-auto max-w-[210mm] space-y-7 bg-white px-8 py-10 font-serif text-slate-900">
    <header class="overflow-hidden rounded-2xl border border-[#003D5B]/12 bg-white shadow-[0_2px_8px_rgba(0,61,91,0.06)]">
      <div class="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.85fr)] items-start gap-6 px-8 py-8">
        <div class="flex gap-5">
          <img src="../../../../public/clinic-logo.svg" alt="Logo" class="h-[162px] w-[162px] shrink-0 rounded-xl border border-[#003D5B]/10 bg-white object-contain p-2" />
          <div class="min-w-0 space-y-2 pt-1">
            <p class="text-[13px] font-bold tracking-wide text-[#003D5B]">${escapeHtml(report.clinic.name)}</p>
            <p class="flex gap-2.5 text-[10px] text-slate-600"><span class="text-[#003D5B]/55">📍</span>${escapeHtml(report.clinic.address)}</p>
            <p class="flex gap-2.5 text-[10px] text-slate-600"><span class="text-[#003D5B]/55">☎</span>Tel: ${escapeHtml(report.clinic.phone)}</p>
            <p class="flex gap-2.5 text-[10px] text-slate-600"><span class="text-[#003D5B]/55">🌐</span>${escapeHtml(report.clinic.website)}</p>
            ${report.clinic.email ? `<p class="flex gap-2.5 text-[10px] text-slate-600"><span class="text-[#003D5B]/55">✉</span>${escapeHtml(report.clinic.email)}</p>` : ''}
          </div>
        </div>
        <div class="space-y-2.5 text-center">
          <p class="text-[10px] font-medium italic tracking-wide text-slate-500">Raport medical de screening cardiovascular</p>
          <p class="text-[22px] font-bold uppercase leading-tight tracking-[0.1em] text-[#003D5B]">${escapeHtml(formatUpper(copy.header_campaign_label))}</p>
          <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#003D5B]/75">Campanie de prevenție cardiovasculară</p>
          <p class="text-[14px] font-bold uppercase tracking-[0.1em] text-slate-800">${escapeHtml(festivalTitle)}</p>
          ${report.event.edition ? `<p class="text-[11px] font-semibold uppercase tracking-wide text-slate-600">${escapeHtml(formatUpper(report.event.edition))}</p>` : ''}
          <p class="text-[11px] font-medium text-slate-500">${escapeHtml(report.event.work_point)}</p>
          <div class="mx-auto mt-4 flex max-w-[300px] flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-[#003D5B]/8 pt-3.5 text-[9px] text-slate-500">
            <span><span class="font-medium uppercase tracking-wide text-slate-400">Nr. </span><span class="font-semibold text-slate-600">${escapeHtml(report.metadata.report_number)}</span></span>
            <span class="text-slate-300">|</span>
            <span>${escapeHtml(report.metadata.screening_date.date_line)}</span>
            <span class="text-slate-300">|</span>
            <span>${escapeHtml(report.metadata.screening_date.time_line)}</span>
          </div>
        </div>
        <div class="flex justify-end pt-2">
          <div class="flex h-[112px] w-[112px] flex-col items-center justify-center rounded-xl border border-dashed border-[#003D5B]/25 bg-slate-50/80 text-center">
            <span class="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Cod QR</span>
          </div>
        </div>
      </div>
    </header>

    <section class="rounded-2xl border border-[#003D5B]/8 bg-gradient-to-r from-[#003D5B]/[0.03] via-white to-[#003D5B]/[0.02] px-6 py-5 text-center">
      <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Cu sprijinul</p>
      <p class="mt-1 text-[13px] font-bold tracking-wide text-[#003D5B]">${escapeHtml(formatSponsorLine(report.event.sponsor_name ?? ''))}</p>
    </section>

    <section class="rounded-2xl border border-[#003D5B]/10 bg-white px-6 py-6 shadow-sm">
      <div class="mx-auto max-w-md border-b border-[#003D5B]/10 pb-3">
        <p class="text-center text-[10px] font-bold uppercase tracking-[0.2em] text-[#003D5B]/80">${escapeHtml(copy.partners_title)}</p>
      </div>
      <div class="mx-auto mt-6 grid max-w-3xl grid-cols-3 gap-4">
        ${partnerPlaceholder('Festival Tradiții Argeșene')}
        ${partnerPlaceholder(copy.partner_naturalis)}
        ${partnerPlaceholder(copy.partner_colegiul_medicilor)}
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-white px-6 py-5 shadow-sm">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003D5B]">Date participant</h2>
      <dl class="mt-4 grid grid-cols-5 gap-3">
        ${participantRows
          .map(
            ([label, value]) => `
          <div class="rounded-xl border border-slate-100/90 bg-slate-50/50 px-3.5 py-3">
            <dt class="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">${escapeHtml(String(label))}</dt>
            <dd class="mt-1 text-[11px] font-semibold leading-snug text-slate-800">${escapeHtml(String(value))}</dd>
          </div>`,
          )
          .join('')}
      </dl>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-white px-6 py-5 shadow-sm">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003D5B]">${escapeHtml(copy.screening_questions_title)}</h2>
      <table class="mt-4 w-full overflow-hidden rounded-xl border border-slate-200/90 text-[11px]">
        <thead class="border-b border-[#003D5B]/10 bg-[#003D5B]/[0.05] text-[9px] uppercase tracking-[0.1em] text-[#003D5B]">
          <tr><th class="px-4 py-3 text-left font-semibold">Factor</th><th class="px-4 py-3 text-left font-semibold">Răspuns</th></tr>
        </thead>
        <tbody>
          ${report.layout.screening_questions
            .map(
              (row, index) => `
            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} border-b border-slate-100 last:border-b-0">
              <td class="px-4 py-3.5 font-medium text-slate-600">${escapeHtml(row.topic)}</td>
              <td class="px-4 py-3.5">${screeningBadge(row.answer)}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-white px-6 py-5 shadow-sm">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003D5B]">${escapeHtml(SECTION_TITLE_MEASUREMENTS)}</h2>
      <table class="mt-4 w-full overflow-hidden rounded-xl border border-slate-200/90 text-[11px]">
        <thead class="border-b border-[#003D5B]/10 bg-[#003D5B]/[0.05] text-[9px] uppercase tracking-[0.1em] text-[#003D5B]">
          <tr>
            <th class="px-4 py-3 text-left font-semibold">${escapeHtml(report.layout.measurement_labels.parameter)}</th>
            <th class="px-4 py-3 text-left font-semibold">${escapeHtml(report.layout.measurement_labels.value)}</th>
            <th class="px-4 py-3 text-left font-semibold">${escapeHtml(report.layout.measurement_labels.interpretation)}</th>
          </tr>
        </thead>
        <tbody>
          ${report.measurements.rows
            .map((row, index) => {
              const abnormal = row.status_level === 'attention' || row.status_level === 'critical';
              return `
            <tr class="${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'} ${abnormal ? 'bg-amber-50/60' : ''} border-b border-slate-100 last:border-b-0">
              <td class="px-4 py-5 font-medium text-slate-600">${escapeHtml(row.parameter)}</td>
              <td class="px-4 py-5 font-semibold ${abnormal ? 'text-red-800' : 'text-slate-900'}">${escapeHtml(row.result)}</td>
              <td class="px-4 py-5 text-[10px] font-semibold">${escapeHtml(row.status_label)}</td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </section>

    <section class="overflow-hidden rounded-2xl border-2 border-[#003D5B]/30 bg-gradient-to-br from-[#003D5B]/[0.09] via-white to-[#003D5B]/[0.04] px-7 py-8 shadow-[0_6px_20px_rgba(0,61,91,0.1)] ring-1 ring-[#003D5B]/10">
      <div class="flex items-start justify-between gap-4">
        <h2 class="text-[14px] font-bold uppercase tracking-[0.14em] text-[#003D5B]">${escapeHtml(report.layout.cardiovascular_risk.title)}</h2>
        <span class="rounded-full bg-[#003D5B] px-6 py-2.5 text-[12px] font-bold uppercase tracking-[0.14em] text-white shadow-lg">${escapeHtml(report.layout.cardiovascular_risk.level_label)}</span>
      </div>
      <p class="mt-6 text-[12px] leading-[1.85] text-slate-700">${escapeHtml(report.layout.cardiovascular_risk.summary)}</p>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#38A649]/20 border-l-4 border-l-[#38A649] bg-[#38A649]/[0.04] px-6 py-5">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003D5B]">${escapeHtml(SECTION_TITLE_RECOMMENDATIONS)}</h2>
      <p class="mt-3 text-[11px] leading-[1.65] text-slate-700">${escapeHtml(report.recommendations.intro)}</p>
      <ul class="mt-3 space-y-2">${report.recommendations.items.map((item) => `<li class="text-[11px] leading-[1.65] text-slate-800">• ${escapeHtml(item.text)}</li>`).join('')}</ul>
    </section>

    <section class="grid grid-cols-2 gap-4">
      ${[
        [copy.blood_pressure_education_title, copy.blood_pressure_education_items, 'TA'],
        [copy.glucose_education_title, copy.glucose_education_items, 'GL'],
      ]
        .map(
          ([title, items, icon]) => `
        <div class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-white px-5 py-5 shadow-sm">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#003D5B]/10 bg-[#003D5B]/[0.04] text-[10px] font-bold text-[#003D5B]">${icon}</span>
            <div>
              <h3 class="text-[10px] font-bold uppercase tracking-[0.12em] text-[#003D5B]">${escapeHtml(String(title))}</h3>
              <ul class="mt-3 space-y-1.5">${(items as string[]).map((tip) => `<li class="text-[10px] leading-relaxed text-slate-700">• ${escapeHtml(tip)}</li>`).join('')}</ul>
            </div>
          </div>
        </div>`,
        )
        .join('')}
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-slate-50/80 px-6 py-6">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.14em] text-[#003D5B]">${escapeHtml(copy.gdpr_section_title)}</h2>
      <p class="mt-4 text-[10.5px] leading-[1.85] tracking-[0.01em] text-slate-600">${escapeHtml(copy.gdpr_text)}</p>
    </section>

    <section class="overflow-hidden rounded-2xl border border-[#003D5B]/10 bg-white px-6 py-5">
      <h2 class="text-[11px] font-bold uppercase tracking-[0.16em] text-[#003D5B]">${escapeHtml(copy.signature_section_title)}</h2>
      <div class="mt-4 flex min-h-[140px] items-end justify-center rounded-xl border border-dashed border-[#003D5B]/20 bg-slate-50/50 px-6 py-5">
        <span class="pb-1 text-[10px] text-slate-400">Semnătura va fi colectată la finalul screeningului</span>
      </div>
    </section>

    <section class="overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/55 px-6 py-7">
      <p class="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-900">${escapeHtml(copy.disclaimer_title)}</p>
      <p class="mt-4 text-[10.5px] leading-[1.9] tracking-[0.01em] text-amber-950/95">${escapeHtml(copy.disclaimer_intro)}</p>
      <ul class="mt-4 space-y-2.5">${copy.disclaimer_bullets.map((item) => `<li class="text-[10.5px] leading-[1.85] tracking-[0.01em] text-amber-950/95">• ${escapeHtml(item)}</li>`).join('')}</ul>
      <p class="mt-5 border-t border-amber-200/70 pt-4 text-[10.5px] leading-[1.9] tracking-[0.01em] text-amber-950/90">${escapeHtml(copy.disclaimer_footer)}</p>
    </section>
  </article>
</body>
</html>`,
);

const screenshotPath = join(outDir, 'participant-report-premium-html.png');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 920, height: 1600 } });
await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
await page.locator('#clinical-report').screenshot({ path: screenshotPath, fullPage: true });
await browser.close();

console.log(JSON.stringify({ htmlFile: htmlPath, htmlScreenshot: screenshotPath }, null, 2));
