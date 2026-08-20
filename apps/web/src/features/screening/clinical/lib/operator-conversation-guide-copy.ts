import type { ClinicalWarning } from '@medscreen/types';

export type OperatorAlertGuideKey =
  | 'high_blood_pressure'
  | 'high_glucose'
  | 'low_spo2'
  | 'abnormal_pulse'
  | 'arrhythmia'
  | 'bmi'
  | 'smoking'
  | 'known_diabetes'
  | 'snoring'
  | 'chest_pain'
  | 'dyspnea';

/** Operator-only copy — direct lines to read aloud; never included in participant PDF/report. */
export const OPERATOR_CONVERSATION_GUIDES: Record<OperatorAlertGuideKey, string> = {
  high_blood_pressure:
    'Stați liniștit — tensiunea de azi e puțin ridicată. Vă recomandăm un control de rutină la medicul de familie zilele următoare.',
  high_glucose:
    'Valorile de azi sunt puțin peste medie; poate fi și de la ce ați mâncat. Merită o verificare pe nemâncate la medic.',
  low_spo2:
    'Saturația de oxigen a ieșit puțin sub normal. E bine să discutați cu un medic, mai ales dacă aveți și alte simptome respiratorii.',
  abnormal_pulse:
    'Pulsul de azi e puțin diferit de obișnuit. Recomandăm o verificare de rutină, mai ales dacă simțiți palpitații sau amețeli.',
  arrhythmia:
    'Ritmul cardiac merită urmărit de un medic, mai ales dacă simțiți bătăi neregulate — nu e neapărat grav, dar merită verificat.',
  bmi:
    'Greutatea de azi indică un surplus ușor. E un moment bun să discutați cu medicul despre obiceiuri sănătoase, pas cu pas.',
  smoking:
    'Mulțumim pentru sinceritate. Renunțarea la fumat, chiar treptat, aduce beneficii reale — puteți discuta opțiuni cu medicul.',
  known_diabetes:
    'E bine că știți de diabet. Valorile de azi sunt un motiv bun pentru o discuție de rutină cu medicul, nu un motiv de panică.',
  snoring:
    'Sforăitul poate afecta odihna. E util să discutați cu medicul — există soluții simple care chiar ajută.',
  chest_pain:
    'E important să discutați orice discomfort în piept cu un medic — chiar dacă vă simțiți bine azi, merită o evaluare.',
  dyspnea:
    'Lipsa de aer raportată merită atenție de la medic, mai ales dacă apare la efort. Nu e un motiv de panică, dar merită o evaluare.',
};

const FACTOR_PATTERNS: Array<{ pattern: RegExp; key: OperatorAlertGuideKey }> = [
  { pattern: /tensiune/i, key: 'high_blood_pressure' },
  { pattern: /glicemie/i, key: 'high_glucose' },
  { pattern: /\bimc\b/i, key: 'bmi' },
  { pattern: /fumător|fumat/i, key: 'smoking' },
  { pattern: /diabet/i, key: 'known_diabetes' },
  { pattern: /sforăit/i, key: 'snoring' },
  { pattern: /dispnee|lips[aă] de aer/i, key: 'dyspnea' },
  { pattern: /durere toracic|durere.*piept|piept/i, key: 'chest_pain' },
  { pattern: /aritm/i, key: 'arrhythmia' },
  { pattern: /puls/i, key: 'abnormal_pulse' },
  { pattern: /satura|spo2|oxigen/i, key: 'low_spo2' },
];

const WARNING_FIELD_KEYS: Record<string, OperatorAlertGuideKey> = {
  systolic_bp: 'high_blood_pressure',
  diastolic_bp: 'high_blood_pressure',
  blood_glucose: 'high_glucose',
  pulse: 'abnormal_pulse',
  oxygen_saturation: 'low_spo2',
  bmi: 'bmi',
};

export function resolveGuideKeyFromFactor(factor: string): OperatorAlertGuideKey | null {
  for (const { pattern, key } of FACTOR_PATTERNS) {
    if (pattern.test(factor)) {
      return key;
    }
  }
  return null;
}

export function resolveGuideKeyFromWarning(warning: ClinicalWarning): OperatorAlertGuideKey | null {
  if (warning.code === 'chest_pain') {
    return 'chest_pain';
  }

  if (warning.source_field && WARNING_FIELD_KEYS[warning.source_field]) {
    return WARNING_FIELD_KEYS[warning.source_field];
  }

  if (warning.code.startsWith('measurement_')) {
    const field = warning.code.replace('measurement_', '');
    return WARNING_FIELD_KEYS[field] ?? null;
  }

  if (/cardiovascular/i.test(warning.code)) {
    return 'high_blood_pressure';
  }
  if (/diabetes/i.test(warning.code)) {
    return 'high_glucose';
  }
  if (/sleep_apnea/i.test(warning.code)) {
    return 'snoring';
  }

  return resolveGuideKeyFromFactor(warning.message);
}

export function getOperatorConversationGuide(key: OperatorAlertGuideKey): string {
  return OPERATOR_CONVERSATION_GUIDES[key];
}

export function getGuideForFactor(factor: string): string | null {
  const key = resolveGuideKeyFromFactor(factor);
  return key ? getOperatorConversationGuide(key) : null;
}

export function getGuideForWarning(warning: ClinicalWarning): string | null {
  const key = resolveGuideKeyFromWarning(warning);
  return key ? getOperatorConversationGuide(key) : null;
}

export function collectCoveredGuideKeys(input: {
  warnings: ClinicalWarning[];
  riskFactors: string[];
}): Set<OperatorAlertGuideKey> {
  const covered = new Set<OperatorAlertGuideKey>();

  for (const warning of input.warnings) {
    const key = resolveGuideKeyFromWarning(warning);
    if (key) {
      covered.add(key);
    }
  }

  for (const factor of input.riskFactors) {
    const key = resolveGuideKeyFromFactor(factor);
    if (key) {
      covered.add(key);
    }
  }

  return covered;
}
