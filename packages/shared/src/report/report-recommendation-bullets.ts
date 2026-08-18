import type { ClinicalRecommendation } from '@medscreen/types';

import { MAX_RECOMMENDATION_ITEMS } from './participant-report.constants';
import type { ReportRecommendation } from './participant-report.schema';

export const PARTICIPANT_RECOMMENDATIONS_INTRO =
  'Pe baza informațiilor și măsurătorilor efectuate vă recomandăm:';

const BULLETS_BY_CODE: Record<string, string[]> = {
  chest_pain_evaluation: ['consult cardiologic'],
  dyspnea_evaluation: ['consult pneumologic'],
  bp_urgent_evaluation: ['consult cardiologic'],
  bp_repeat_monitoring: [
    'monitorizarea tensiunii arteriale la domiciliu timp de 5–7 zile consecutive (două măsurători pe zi după minimum 10 minute de repaus)',
  ],
  bp_specialist_referral: ['consult cardiologic'],
  pulse_evaluation: ['discutarea rezultatului pulsului cu medicul de familie'],
  spo2_evaluation: ['consult pneumologic'],
  glucose_repeat_testing: ['consult diabetologic'],
  glucose_specialist_referral: ['consult diabetologic'],
  known_diabetes_follow_up: ['consult diabetologic'],
  bmi_lifestyle: ['reducerea greutății corporale', 'alimentație echilibrată', 'activitate fizică regulată'],
  waist_lifestyle: ['reducerea circumferinței abdominale prin alimentație echilibrată și mișcare regulată'],
  smoking_cessation: ['renunțarea la fumat'],
  smoking_abstinence: ['menținerea abstinenței de la fumat'],
  snoring_sleep_evaluation: ['consult pneumologic'],
  healthy_congratulations: ['continuarea obiceiurilor sănătoase actuale'],
  healthy_habits: ['alimentație echilibrată', 'activitate fizică regulată'],
  healthy_preventive_screening: ['screening medical preventiv periodic'],
};

function normalizeBullet(bullet: string): string {
  const trimmed = bullet.trim();
  return trimmed.endsWith(';') ? trimmed : `${trimmed};`;
}

/** Flat, deduplicated recommendation bullets for the participant report. */
export function buildParticipantRecommendationBullets(
  recommendations: ClinicalRecommendation[],
): string[] {
  const seen = new Set<string>();
  const bullets: string[] = [];

  for (const recommendation of recommendations) {
    const mapped = BULLETS_BY_CODE[recommendation.code] ?? [recommendation.message];
    for (const bullet of mapped) {
      const normalized = normalizeBullet(bullet);
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      bullets.push(normalized);
    }
  }

  return bullets;
}

/** Structured recommendation items for the canonical ParticipantReport model. */
export function buildParticipantRecommendationItems(
  recommendations: ClinicalRecommendation[],
): ReportRecommendation[] {
  const seen = new Set<string>();
  const items: ReportRecommendation[] = [];

  for (const recommendation of recommendations) {
    const mapped = BULLETS_BY_CODE[recommendation.code] ?? [recommendation.message];
    for (const bullet of mapped) {
      const normalized = normalizeBullet(bullet);
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({
        code: recommendation.code,
        text: normalized,
        priority: recommendation.priority,
      });
      if (items.length >= MAX_RECOMMENDATION_ITEMS) return items;
    }
  }

  return items;
}
