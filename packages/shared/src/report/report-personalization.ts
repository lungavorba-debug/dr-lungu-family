import type {
  ClinicalEvaluationResult,
  ClinicalRiskCategory,
  ClinicalRiskLevel,
  PatientGender,
} from '@medscreen/types';

const LEVEL_LABELS_RO: Record<ClinicalRiskLevel, string> = {
  unknown: 'NEEVALUAT COMPLET',
  low: 'SCĂZUT',
  moderate: 'MODERAT',
  elevated: 'RIDICAT',
};

export const RISK_CARD_TITLES = {
  cardiovascular: 'Risc cardiac',
  diabetes: 'Risc diabet',
  sleep_apnea: 'Risc apnee în somn',
} as const;

const PARTICIPANT_EXPLANATIONS: Record<
  ClinicalRiskCategory,
  Record<ClinicalRiskLevel, string>
> = {
  cardiovascular: {
    unknown:
      'Nu există suficiente date pentru o evaluare completă a riscului cardiac în cadrul acestui screening.',
    low: 'Valorile măsurate nu indică semnale accentuate pentru inimă și vase de sânge la acest screening.',
    moderate:
      'Au fost identificate câteva valori care merită discutate cu un medic specialist.',
    elevated:
      'Au fost identificate valori care necesită atenție medicală suplimentară.',
  },
  diabetes: {
    unknown: 'Nu există suficiente date glicemice pentru o evaluare completă.',
    low: 'Valorile glicemice actuale nu indică semnale metabolice accentuate la acest screening.',
    moderate:
      'Au fost identificate valori metabolice care merită discutate cu un medic specialist.',
    elevated:
      'Au fost identificate valori glicemice care necesită atenție medicală suplimentară.',
  },
  sleep_apnea: {
    unknown: 'Nu există suficiente informații despre somn pentru o evaluare completă.',
    low: 'Nu au fost identificate semnale relevante pentru apnee în somn la acest screening.',
    moderate:
      'Au fost identificate câteva semnale legate de somn care merită discutate cu un medic specialist.',
    elevated:
      'Au fost identificate semnale legate de somn care necesită evaluare medicală suplimentară.',
  },
};

export function getParticipantDisplayName(
  gender: PatientGender,
  firstName: string,
  lastName: string,
): string {
  const title = gender === 'F' ? 'Doamna' : 'Domnul';
  return `${title} ${firstName} ${lastName}`;
}

/** @deprecated Use getParticipantDisplayName */
export function getParticipantSalutation(gender: PatientGender, lastName: string): string {
  const title = gender === 'F' ? 'Doamnă' : 'Domnule';
  return `${title} ${lastName}`;
}

export function getRiskLevelLabelRo(level: ClinicalRiskLevel): string {
  return LEVEL_LABELS_RO[level];
}

export function getParticipantRiskExplanation(
  category: ClinicalRiskCategory,
  level: ClinicalRiskLevel,
): string {
  return PARTICIPANT_EXPLANATIONS[category][level];
}

export function buildPatientGeneralResult(cardiovascularLevel: ClinicalRiskLevel): string {
  const levelPhrase: Record<ClinicalRiskLevel, string> = {
    unknown: 'neevaluat complet în cadrul acestui screening',
    low: 'scăzut',
    moderate: 'moderat',
    elevated: 'ridicat',
  };
  return `Riscul evaluat pentru sănătatea cardiacă este ${levelPhrase[cardiovascularLevel]}.`;
}

const RECOMMENDATION_BY_CODE: Record<string, string> = {
  demo_cv_review:
    'Dacă aceste valori se confirmă la măsurători repetate, vă recomandăm să programați un consult la un medic cardiolog.',
  demo_diabetes_review:
    'Dacă valorile glicemiei rămân crescute, vă recomandăm un consult la un medic diabetolog.',
  demo_sleep_review:
    'Dacă simptomele persistă, vă recomandăm un consult la un medic pneumolog sau într-un centru specializat în medicina somnului.',
  demo_general_follow_up:
    'Vă recomandăm să solicitați o evaluare medicală de specialitate.',
  demo_urgent_review:
    'Au fost identificate valori care necesită atenție imediată. Vă recomandăm să solicitați o evaluare medicală de specialitate cât mai curând.',
};

const RECOMMENDATION_BY_CATEGORY: Record<string, string> = {
  cardiovascular:
    'Dacă aceste valori se confirmă la măsurători repetate, vă recomandăm să programați un consult la un medic cardiolog.',
  diabetes:
    'Dacă valorile glicemiei rămân crescute, vă recomandăm un consult la un medic diabetolog.',
  sleep_apnea:
    'Dacă simptomele persistă, vă recomandăm un consult la un medic pneumolog sau într-un centru specializat în medicina somnului.',
  general: 'Vă recomandăm să solicitați o evaluare medicală de specialitate.',
};

const ENGLISH_FRAGMENT =
  /\b(cardiovascular|diabetes|sleep_apnea|signal|signals|detected|elevated|moderate|low|unknown|general|recommendation|follow-up|review|GP|cardiologist|placeholder|demo|protocol|per)\b/i;

export function buildPatientRecommendation(rec: {
  code: string;
  message: string;
  category?: string;
}): string {
  if (RECOMMENDATION_BY_CODE[rec.code]) {
    return RECOMMENDATION_BY_CODE[rec.code];
  }

  const category = rec.category ?? 'general';
  if (RECOMMENDATION_BY_CATEGORY[category]) {
    return RECOMMENDATION_BY_CATEGORY[category];
  }

  const cleaned = sanitizeParticipantFacingText(rec.message);
  if (cleaned.length === 0 || containsEnglish(cleaned)) {
    return RECOMMENDATION_BY_CATEGORY.general;
  }

  return cleaned;
}

/** @deprecated Use buildPatientRecommendation */
export function humanizeRecommendationMessage(message: string): string {
  return buildPatientRecommendation({ code: '', message, category: 'general' });
}

export function containsEnglish(text: string): boolean {
  return ENGLISH_FRAGMENT.test(text);
}

export function stripDemoPrefix(text: string): string {
  return text.replace(/^\[DEMO\]\s*/i, '').trim();
}

const DEMO_SUFFIX_PATTERNS = [
  /\s*\(demo threshold\)/gi,
  /\s*\(demo flag\)/gi,
  /\s*\(demo combination\)/gi,
  /\s*\(demo metabolic flag\)/gi,
  /\s*\bdemo threshold\b/gi,
  /\s*\bdemo flag\b/gi,
];

const PARTICIPANT_FACTOR_TRANSLATIONS: Record<string, string> = {
  'Chest pain reported (demo flag)': 'Durere toracică raportată',
  'Chest pain reported — operator should ensure appropriate follow-up pathway.':
    'Durere toracică raportată — recomandăm evaluare medicală.',
  'Known hypertension (reported)': 'Hipertensiune cunoscută',
  'On antihypertensive treatment': 'Tratament antihipertensiv în curs',
  'Current smoker': 'Fumător curent',
  'Known diabetes reported': 'Diabet cunoscut',
  'Snoring reported': 'Sforăit raportat',
  'Dyspnea reported': 'Dispnee raportată',
  'No elevated demo cardiovascular signals detected':
    'Nu au fost identificate valori accentuate pentru inimă și vase de sânge.',
  'Some demo cardiovascular signals — review recommended':
    'Au fost identificate valori care merită discutate cu un medic specialist.',
  'Elevated demo cardiovascular signals — priority review':
    'Au fost identificate valori care necesită atenție medicală.',
};

const INTERPRETATION_TITLE_RO: Record<string, string> = {
  'participant context': 'Context participant',
  'risk overview': 'Sumar riscuri',
  'recommendations count': 'Recomandări generate',
};

const HIDDEN_INTERPRETATION_TITLES = new Set(['demo rule notice']);

/** Removes developer/demo markers and translates operator-facing engine text to Romanian. */
export function sanitizeParticipantFacingText(text: string): string {
  let cleaned = stripDemoPrefix(text);
  for (const pattern of DEMO_SUFFIX_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned
    .replace(/\[DEMO\]/gi, '')
    .replace(/\bPlaceholder\b/gi, '')
    .replace(/\bDevelopment only\b/gi, '')
    .replace(/\bdemo recommendation\(s\)\b/gi, 'recomandări')
    .replace(/\bdemo general follow[- ]up\b/gi, 'recomandare generală')
    .replace(/\belevated area\(s\) flagged for operator review\b/gi, 'zone cu valori ridicate')
    .replace(/\bmoderate signal\(s\)\b/gi, 'valori moderate')
    .replace(/\broutine follow-up suggested\b/gi, 'recomandată evaluare de rutină')
    .replace(/\bNo elevated placeholder signals across assessed categories\b/gi, 'Nu au fost identificate valori ridicate în categoriile evaluate.')
    .replace(/Systolic BP ≥ (\d+) mmHg/gi, 'Tensiune sistolică ≥ $1 mmHg')
    .replace(/Diastolic BP ≥ (\d+) mmHg/gi, 'Tensiune diastolică ≥ $1 mmHg')
    .replace(/Fasting glucose ≥ (\d+) mg\/dL/gi, 'Glicemie a jeun ≥ $1 mg/dL')
    .replace(/Non-fasting glucose ≥ (\d+) mg\/dL/gi, 'Glicemie postprandială ≥ $1 mg/dL')
    .replace(/Glucose ≥ (\d+) mg\/dL without status/gi, 'Glicemie ≥ $1 mg/dL')
    .replace(/BMI ≥ (\d+)/gi, 'IMC ≥ $1')
    .replace(/Snoring \+ BMI ≥ (\d+)/gi, 'Sforăit și IMC ≥ $1')
    .replace(/Age (\d+), sex ([MF])\./gi, 'Vârstă $1 ani, sex $2.')
    .replace(/Screening captured at ([^.]+)\./gi, 'Screening efectuat la $1.')
    .replace(/Cardiovascular signals detected[^.]*\./gi, '')
    .replace(/Glycemic\/metabolic signals detected[^.]*\./gi, '')
    .replace(/Sleep-related signals detected[^.]*\./gi, '')
    .replace(/Discuss screening results[^.]*\./gi, '')
    .replace(/referral to GP\/cardiologist[^.]*\./gi, '')
    .replace(/\b(cardiovascular signals detected)\b/gi, '')
    .replace(/\b(cardiovascular signal)\b/gi, '')
    .replace(/\b(GP\/cardiologist)\b/gi, '')
    .replace(/\b(General recommendation)\b/gi, 'Recomandare generală')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (PARTICIPANT_FACTOR_TRANSLATIONS[cleaned]) {
    return PARTICIPANT_FACTOR_TRANSLATIONS[cleaned];
  }

  for (const [english, romanian] of Object.entries(PARTICIPANT_FACTOR_TRANSLATIONS)) {
    if (cleaned.includes(english)) {
      cleaned = cleaned.replace(english, romanian);
    }
  }

  cleaned = cleaned.replace(/\s+—\s+—/g, ' — ').trim();

  if (containsEnglish(cleaned)) {
    return '';
  }

  return cleaned;
}

export function translateInterpretationSectionTitle(title: string): string | null {
  const normalized = title.trim().toLowerCase();
  if (HIDDEN_INTERPRETATION_TITLES.has(normalized)) {
    return null;
  }
  return INTERPRETATION_TITLE_RO[normalized] ?? sanitizeParticipantFacingText(title);
}

export function translateRiskOverviewLine(line: string): string {
  const match = line.match(/^(\w+):\s*(\w+)\s*—\s*(.*)$/);
  if (!match) {
    return sanitizeParticipantFacingText(line);
  }

  const [, category, , summary] = match;
  const categoryRo = RISK_CARD_TITLES[category as ClinicalRiskCategory] ?? category;
  return `${categoryRo} — ${sanitizeParticipantFacingText(summary)}`;
}

export function collectParticipantRiskFactors(
  risks: ClinicalEvaluationResult['risks'],
): string[] {
  const categories: ClinicalRiskCategory[] = ['cardiovascular', 'diabetes', 'sleep_apnea'];
  const factors = new Set<string>();

  for (const category of categories) {
    for (const factor of risks[category].factors) {
      const cleaned = sanitizeParticipantFacingText(factor);
      if (cleaned.length > 0 && !containsEnglish(cleaned)) {
        factors.add(cleaned);
      }
    }
  }

  return [...factors];
}

export function formatReportDate(isoDate: string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  })
    .format(new Date(isoDate))
    .replace(/\b(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\b/i, (m) =>
      m.toLowerCase(),
    );
}

export function buildPersonalizedClinicalSummary(
  salutation: string,
  cardiovascularLevel: ClinicalRiskLevel,
): string {
  const levelLabel = getRiskLevelLabelRo(cardiovascularLevel);
  return `${salutation},\n\nÎn urma screeningului efectuat astăzi, evaluarea indică un risc cardiac ${levelLabel}.`;
}

export function getRiskCategoryLabelRo(category: ClinicalRiskCategory): string {
  return RISK_CARD_TITLES[category];
}
