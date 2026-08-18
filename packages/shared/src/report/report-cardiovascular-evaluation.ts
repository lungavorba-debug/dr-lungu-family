import type { ClinicalRiskLevel, MedicalMeasurements } from '@medscreen/types';

import { CLINICAL_THRESHOLDS } from '../clinical/thresholds';
import {
  isBloodPressureLow,
  isPulseLow,
} from '../clinical/participant-view/threshold-evaluators';

export const EVALUATION_SUMMARY_LOW_OPTIMAL =
  'Felicitări! Valorile tensional-arteriale și parametrii măsurați se încadrează în limitele normale. Continuați să aveți grijă de sănătatea dumneavoastră printr-o alimentație echilibrată și mișcare zilnică.';

export const EVALUATION_SUMMARY_MODERATE =
  'Atenție moderată: Am înregistrat mici abateri de la valorile tensional-arteriale ideale. Nu este un motiv de panică, dar vă recomandăm o verificare periodică la medicul de familie.';

export const EVALUATION_SUMMARY_HIGH =
  'Recomandare importantă: Valorile tensiunii arteriale măsurate astăzi sunt peste limitele obișnuite. Vă recomandăm o consultație la medicul de familie sau la un medic specialist pentru o verificare amănunțită și sfaturi personalizate.';

export const EVALUATION_SUMMARY_LOW_VALUES =
  'Notă: Tensiunea arterială sau pulsul sunt sub nivelul mediu obișnuit. Dacă vă simțiți obosit sau amețit, este bine să discutați cu medicul dumneavoastră și să vă hidratați corespunzător.';

export function hasLowVitalMeasurements(measurements: MedicalMeasurements): boolean {
  const lowBp = isBloodPressureLow(measurements);
  const lowPulse = measurements.pulse !== null && isPulseLow(measurements.pulse);
  const lowGlucose =
    measurements.blood_glucose !== null &&
    measurements.blood_glucose < CLINICAL_THRESHOLDS.glucose.low;

  return lowBp || lowPulse || lowGlucose;
}

export function buildCardiovascularEvaluationSummary(
  level: ClinicalRiskLevel,
  measurements: MedicalMeasurements,
): string {
  if (hasLowVitalMeasurements(measurements)) {
    return EVALUATION_SUMMARY_LOW_VALUES;
  }

  switch (level) {
    case 'moderate':
      return EVALUATION_SUMMARY_MODERATE;
    case 'elevated':
      return EVALUATION_SUMMARY_HIGH;
    case 'low':
    case 'unknown':
    default:
      return EVALUATION_SUMMARY_LOW_OPTIMAL;
  }
}
