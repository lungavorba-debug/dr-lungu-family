import type { ClinicalRiskLevel, MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';

import { buildDynamicEvaluationSummary } from './build-dynamic-evaluation-summary';

export {
  buildDynamicEvaluationSummary,
  type DynamicEvaluationResult,
  type EvaluationFinding,
} from './build-dynamic-evaluation-summary';

/** @deprecated Use buildDynamicEvaluationSummary instead. */
export const EVALUATION_SUMMARY_LOW_OPTIMAL =
  'Valorile măsurate astăzi se încadrează în limite normale.';

/** @deprecated */
export const EVALUATION_SUMMARY_MODERATE = 'Atenție moderată la unele valori măsurate.';

/** @deprecated */
export const EVALUATION_SUMMARY_HIGH = 'Recomandare importantă: valori care necesită evaluare medicală.';

/** @deprecated */
export const EVALUATION_SUMMARY_LOW_VALUES = 'Notă: valori sub intervalul obișnuit.';

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
