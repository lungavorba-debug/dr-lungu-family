import type { ClinicalRiskLevel, MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';

import { buildDynamicEvaluationSummary } from './build-dynamic-evaluation-summary';
import { FESTIVAL_EVALUATION_SUMMARY } from './festival-participant-copy';

export {
  buildDynamicEvaluationSummary,
  type DynamicEvaluationResult,
  type EvaluationFinding,
} from './build-dynamic-evaluation-summary';

/** @deprecated Use buildDynamicEvaluationSummary instead. */
export const EVALUATION_SUMMARY_LOW_OPTIMAL = FESTIVAL_EVALUATION_SUMMARY;

/** @deprecated */
export const EVALUATION_SUMMARY_MODERATE = FESTIVAL_EVALUATION_SUMMARY;

/** @deprecated */
export const EVALUATION_SUMMARY_HIGH = FESTIVAL_EVALUATION_SUMMARY;

/** @deprecated */
export const EVALUATION_SUMMARY_LOW_VALUES = FESTIVAL_EVALUATION_SUMMARY;

export function hasLowVitalMeasurements(_measurements: MedicalMeasurements): boolean {
  return false;
}

/** Legacy wrapper — delegates to evidence-based dynamic builder. */
export function buildCardiovascularEvaluationSummary(
  _level: ClinicalRiskLevel,
  measurements: MedicalMeasurements,
  anamnesis?: ScreeningAnamnesis,
  gender: 'M' | 'F' = 'M',
): string {
  return buildDynamicEvaluationSummary({
    measurements,
    anamnesis: anamnesis ?? {
      smoking_status: '',
      alcohol_consumption: '',
      known_diabetes: null,
      chest_pain: null,
      dyspnea: null,
      snoring: null,
      current_treatment: '',
      free_notes: '',
    },
    gender,
  }).summary;
}
