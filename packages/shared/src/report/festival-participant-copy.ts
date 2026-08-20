/**
 * Festival-friendly participant copy — neutral, preventive tone (no direct diagnoses).
 * Internal clinical classification stays in measurement-classifiers.ts for safety logic.
 */
import type { MeasurementClassification } from '../clinical/participant-view/measurement-classifiers';

/** Unified "Evaluare și recomandări" paragraph for all screening outcomes. */
export const FESTIVAL_EVALUATION_SUMMARY =
  'În urma măsurătorilor efectuate astăzi, v-am pregătit această sinteză de screening. ' +
  'Pentru liniștea dumneavoastră și o evaluare detaliată, vă recomandăm să discutați aceste rezultate ' +
  'cu medicul de familie sau cu un medic specialist.';

const FESTIVAL_LABEL_BY_CLINICAL: Record<string, string> = {
  Optimă: 'În limite',
  Normală: 'În limite',
  Normal: 'În limite',
  'Normală (á jeun)': 'În limite',
  'Normală (postprandial)': 'În limite',
  'Normal-înaltă': 'De monitorizat',
  Hipotensiune: 'Valoare scăzută',
  'Hipertensiune grad 1': 'Valoare crescută',
  'Hipertensiune grad 2': 'Atenție sporită',
  'Hipertensiune grad 3': 'Atenție sporită',
  Subponderal: 'Valoare scăzută',
  Supraponderal: 'De monitorizat',
  'Obezitate grad I': 'Valoare crescută',
  'Obezitate grad II': 'Atenție sporită',
  'Obezitate grad III': 'Atenție sporită',
  Scăzută: 'Valoare scăzută',
  'Prediabet (á jeun)': 'De monitorizat',
  'Toleranță alterată (postprandial)': 'De monitorizat',
  'Sugestiv diabet (á jeun)': 'Atenție sporită',
  'Sugestiv diabet (postprandial)': 'Atenție sporită',
  'Ușor scăzută': 'De monitorizat',
  'Sever scăzută': 'Atenție sporită',
  Bradicardie: 'Valoare scăzută',
  Tahicardie: 'Valoare crescută',
  'Risc crescut': 'De monitorizat',
  'Risc foarte crescut': 'Atenție sporită',
};

/** Maps internal clinical category to festival participant-facing table label. */
export function toFestivalParticipantLabel(
  classification: Pick<MeasurementClassification, 'label' | 'severity' | 'isOutOfNormal'>,
): string {
  if (!classification.isOutOfNormal && classification.severity === 'normal') {
    return FESTIVAL_LABEL_BY_CLINICAL[classification.label] ?? 'În limite';
  }

  const mapped = FESTIVAL_LABEL_BY_CLINICAL[classification.label];
  if (mapped) return mapped;

  if (classification.severity === 'critical') return 'Atenție sporită';
  if (classification.severity === 'attention') return 'De monitorizat';
  return 'În limite';
}

/** Participant-facing evaluation level badge (report header). */
export function toFestivalEvaluationLevelLabel(hasFindings: boolean, hasCritical: boolean): string {
  if (!hasFindings) return 'INFORMAȚII';
  if (hasCritical) return 'DE DISCUTAT CU MEDICUL';
  return 'DE MONITORIZAT';
}
