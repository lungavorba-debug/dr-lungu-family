/**
 * Contract tests for ParticipantReport — compile-time shapes + lightweight runtime checks.
 * Run: npm run test:report
 */
import {
  DEFAULT_FINDINGS_SECTION_TITLE,
  DEFAULT_MEASUREMENT_COLUMN_LABELS,
  MAX_RECOMMENDATION_ITEMS,
  MEASUREMENT_COLUMN_OBSERVATION,
  MEASUREMENT_COLUMN_PARAMETER,
  MEASUREMENT_COLUMN_REFERENCE_RANGE,
  MEASUREMENT_COLUMN_RESULT,
  RECOMMENDATIONS_INTRO,
  REPORT_SCHEMA_VERSION,
  REPORT_TITLE,
  SECTION_TITLE_FINDINGS,
  SECTION_TITLE_MEASUREMENTS,
  SECTION_TITLE_RECOMMENDATIONS,
  SECTION_TITLE_SUMMARY,
} from './participant-report.constants';
import { formatParticipantCity } from './format-participant-city';
import type { ParticipantReport } from './participant-report.schema';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

const minimalReport = {
  schema_version: REPORT_SCHEMA_VERSION,
  metadata: {
    report_id: '11111111-0001-4111-8111-000000000001',
    report_number: 'SM-2026-000001',
    report_title: REPORT_TITLE,
    screening_date: {
      iso: '2026-08-01T11:35:00.000Z',
      date_line: '1 august 2026',
      time_line: 'ora 14:35',
    },
    generated_at: '2026-08-01T11:36:00.000Z',
    engine_version: '0.0.0',
    rule_set_id: 'demo',
    report_composer_version: '0.0.0',
    filename: 'MedScreen-Raport-Ion-Popescu-SM-2026-000001.pdf',
  },
  clinic: {
    name: 'Dr. Lungu Family',
    slogan: 'Grijă pentru sănătate',
    phone: '0755 75 45 45',
    address: 'Aleea Spitalului nr. 16, etaj 1, Pitești',
    website: 'www.drlungufamily.ro',
  },
  event: {
    festival_name: 'Festivalul Tradiții Argeșene',
    edition: 'Ediția a XIII-a',
    sponsor_name: 'Primăriei Comunei Corbeni',
    work_point: 'Corbeni',
  },
  participant: {
    display_name: 'Domnul Ion Popescu',
    first_name: 'Ion',
    last_name: 'Popescu',
    age: 45,
    gender: 'M',
    gender_label: 'Masculin',
    phone: '0755123456',
    city: 'Pitești',
  },
  summary: {
    lines: ['Rezumat exemplu.'],
  },
  measurements: {
    rows: [
      {
        parameter: 'Tensiune arterială',
        result: '118 / 76',
        reference_range: 'sub 140/90',
        status_label: 'Normal',
        status_level: 'normal',
      },
    ],
    column_labels: DEFAULT_MEASUREMENT_COLUMN_LABELS,
  },
  findings: {
    section_title: DEFAULT_FINDINGS_SECTION_TITLE,
    items: [],
  },
  recommendations: {
    intro: RECOMMENDATIONS_INTRO,
    items: [
      {
        code: 'healthy_lifestyle',
        text: 'Continuați obiceiurile sănătoase actuale.',
        priority: 'routine',
      },
    ],
  },
  education: [],
  footer: {
    disclaimer_paragraphs: [
      'Acest raport are caracter informativ și nu înlocuiește un consult medical.',
      'Pentru recomandări personalizate vă încurajăm să solicitați o evaluare medicală de specialitate.',
    ],
    operator_name: 'Dr. Maria Lungu',
    clinic_name: 'Dr. Lungu Family',
  },
  layout: {
    screening_questions: [{ topic: 'Fumător', answer: 'Nu' }],
    cardiovascular_risk: {
      title: 'Risc cardiovascular',
      level_label: 'SCĂZUT',
      summary: 'Risc scăzut',
    },
    copy: {
      gdpr_text: 'GDPR',
      disclaimer_title: 'Important',
      disclaimer_intro: 'Intro',
      disclaimer_bullets: [],
      disclaimer_footer: '',
      blood_pressure_education_title: 'TA',
      blood_pressure_education_items: ['repaus'],
      glucose_education_title: 'Glicemie',
      glucose_education_items: ['dimineața'],
      partners_title: 'Parteneri',
      partner_organizer_label: 'Organizator',
      partner_organizer_name: 'Asociația Culturală "Tradiții Argeșene"',
      partner_local_support_label: 'Sprijin local',
      partner_local_support_name: 'Primăria Comunei Corbeni',
      partner_official_label: 'Partener oficial',
      partner_naturalis: 'Naturalis',
      header_campaign_label: 'Screening cardiovascular',
      qr_label: 'Scanează pentru site-ul oficial',
      screening_questions_title: 'Factori de risc cardiovascular',
      signature_section_title: 'Semnătura participant',
      gdpr_section_title: 'Protecția datelor personale',
    },
    measurement_labels: {
      parameter: 'Parametru',
      value: 'Valoare',
      interpretation: 'Interpretare',
    },
  },
  branding: {
    branding_version: '1',
    logo: { asset_id: 'clinic-logo', mime: 'image/jpeg' },
    colors: {
      navy: '#003D5B',
      green: '#38A649',
      ink: '#252B30',
      muted: '#737880',
      rule_grey: '#E5E9EF',
      badge_attention_bg: '#FEF3E2',
      badge_normal_bg: '#EDF7F0',
    },
    typography: {
      report_title_pt: 17,
      section_title_pt: 10,
      participant_name_pt: 13,
      body_pt: 9.5,
      table_header_pt: 7.5,
      footer_pt: 7.5,
      font_family: 'Liberation Serif',
    },
  },
  qr: {
    url: 'https://www.drlungufamily.ro',
    algorithm_version: '1',
  },
} satisfies ParticipantReport;

assert('schema_version is 1', minimalReport.schema_version === 1);
assert('report_title constant', minimalReport.metadata.report_title === REPORT_TITLE);
assert('findings section title', minimalReport.findings.section_title === SECTION_TITLE_FINDINGS);
assert('summary section constant', SECTION_TITLE_SUMMARY === 'Rezumat');
assert('measurements section constant', SECTION_TITLE_MEASUREMENTS === 'Măsurători');
assert('recommendations section constant', SECTION_TITLE_RECOMMENDATIONS === 'Recomandări medicale & stil de viață');
assert('formatParticipantCity title case', formatParticipantCity('pitesti') === 'Pitești');
assert('formatParticipantCity multi word', formatParticipantCity('curtea de arges') === 'Curtea De Arges');
assert('formatParticipantCity voice fix', formatParticipantCity('Ștrfănești') === 'Ștefănești');
assert('column: Parametru', MEASUREMENT_COLUMN_PARAMETER === 'Parametru');
assert('column: Rezultat', MEASUREMENT_COLUMN_RESULT === 'Rezultat');
assert('column: Interval de referință', MEASUREMENT_COLUMN_REFERENCE_RANGE === 'Interval de referință');
assert('column: Observație', MEASUREMENT_COLUMN_OBSERVATION === 'Observație');
assert(
  'measurement column labels',
  minimalReport.measurements.column_labels.parameter === MEASUREMENT_COLUMN_PARAMETER &&
    minimalReport.measurements.column_labels.observation === MEASUREMENT_COLUMN_OBSERVATION,
);
assert(
  'recommendations within max',
  minimalReport.recommendations.items.length <= MAX_RECOMMENDATION_ITEMS,
);
assert('education is array', Array.isArray(minimalReport.education));
assert('findings items is array', Array.isArray(minimalReport.findings.items));

console.log('\nParticipantReport contract tests complete.');
