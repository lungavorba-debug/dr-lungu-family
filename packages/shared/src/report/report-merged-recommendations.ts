import type { ClinicalRecommendation } from '@medscreen/types';

import { MAX_RECOMMENDATION_ITEMS } from './participant-report.constants';
import type { ReportRecommendation } from './participant-report.schema';

const SPECIALIST_REFERRAL_CODES = new Set([
  'chest_pain_evaluation',
  'dyspnea_evaluation',
  'bp_urgent_evaluation',
  'bp_specialist_referral',
  'spo2_evaluation',
  'glucose_repeat_testing',
  'glucose_specialist_referral',
  'known_diabetes_follow_up',
  'snoring_sleep_evaluation',
  'pulse_evaluation',
]);

const CLINICAL_FRIENDLY_TEXT: Record<string, string> = {
  bp_repeat_monitoring:
    'Monitorizați tensiunea arterială acasă timp de 5–7 zile consecutive (dimineața și seara, după minimum 10 minute de repaus).',
  smoking_cessation: 'Renunțarea la fumat este un pas important pentru sănătatea cardiovasculară.',
  smoking_abstinence: 'Continuați să evitați fumatul — este o alegere excelentă pentru sănătate.',
  bmi_lifestyle: 'Mențineți o greutate sănătoasă prin alimentație echilibrată și mișcare regulată.',
  waist_lifestyle: 'Reduceți circumferința abdominală prin alimentație echilibrată și activitate fizică moderată.',
  healthy_congratulations: 'Felicitări — continuați obiceiurile sănătoase pe care le aveți deja.',
  healthy_preventive_screening: 'Programați controale medicale preventive la intervale regulate.',
};

export const LIFESTYLE_RECOMMENDATION_PILLARS: ReportRecommendation[] = [
  {
    code: 'lifestyle_diet',
    text: 'Dietă echilibrată: reduceți consumul de sare, grăsimi și alimente procesate.',
    priority: 'routine',
  },
  {
    code: 'lifestyle_activity',
    text: 'Mișcare și activitate fizică: minimum 30 de minute pe zi, adaptate nivelului dumneavoastră.',
    priority: 'routine',
  },
  {
    code: 'lifestyle_monitoring',
    text: 'Monitorizare periodică: urmăriți valorile măsurate și programați controale regulate.',
    priority: 'routine',
  },
];

const MEDICAL_CONSULT_RECOMMENDATION: ReportRecommendation = {
  code: 'medical_consult',
  text: 'Consultați medicul de familie sau un medic specialist pentru interpretarea completă a rezultatelor și planul de urmărire.',
  priority: 'soon',
};

function capitalizeSentence(text: string): string {
  const trimmed = text.trim().replace(/;$/, '');
  if (trimmed.length === 0) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/** Patient-friendly recommendations — one medical consult line plus lifestyle pillars. */
export function buildMergedReportRecommendations(
  recommendations: ClinicalRecommendation[],
): ReportRecommendation[] {
  const items: ReportRecommendation[] = [];
  const seen = new Set<string>();
  let needsMedicalConsult = false;

  const pushItem = (item: ReportRecommendation): void => {
    const key = item.text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      ...item,
      text: capitalizeSentence(item.text),
    });
  };

  for (const recommendation of recommendations) {
    if (SPECIALIST_REFERRAL_CODES.has(recommendation.code)) {
      needsMedicalConsult = true;
      continue;
    }

    const friendlyText = CLINICAL_FRIENDLY_TEXT[recommendation.code];
    if (friendlyText) {
      pushItem({
        code: recommendation.code,
        text: friendlyText,
        priority: recommendation.priority,
      });
      continue;
    }

    if (recommendation.code.startsWith('healthy_habits')) {
      continue;
    }
  }

  if (needsMedicalConsult) {
    pushItem(MEDICAL_CONSULT_RECOMMENDATION);
  }

  for (const pillar of LIFESTYLE_RECOMMENDATION_PILLARS) {
    pushItem(pillar);
  }

  if (items.length === 0) {
    pushItem(MEDICAL_CONSULT_RECOMMENDATION);
    for (const pillar of LIFESTYLE_RECOMMENDATION_PILLARS) {
      pushItem(pillar);
    }
  }

  return items.slice(0, MAX_RECOMMENDATION_ITEMS);
}
