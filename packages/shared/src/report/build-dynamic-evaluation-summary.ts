/**
 * Evidence-based dynamic "Evaluare și recomandări" text for participant reports.
 * Participant-facing copy uses festival-neutral tone (see festival-participant-copy.ts).
 */
import type { MedicalMeasurements, PatientGender, ScreeningAnamnesis } from '@medscreen/types';

import {
  classifyBloodPressure,
  classifyBmi,
  classifyGlucose,
  classifyPulse,
  classifySpO2,
  classifyWaist,
} from '../clinical/participant-view/measurement-classifiers';
import {
  FESTIVAL_EVALUATION_SUMMARY,
  toFestivalEvaluationLevelLabel,
} from './festival-participant-copy';

export type EvaluationFindingSeverity = 'attention' | 'critical';

export interface EvaluationFinding {
  kind: 'measurement' | 'anamnesis';
  label: string;
  recommendation: string;
  severity: EvaluationFindingSeverity;
}

export interface DynamicEvaluationResult {
  summary: string;
  levelLabel: string;
  findings: EvaluationFinding[];
}

function buildMeasurementFindings(
  measurements: MedicalMeasurements,
  gender: PatientGender,
): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  const checks = [
    classifyBloodPressure(measurements),
    classifyBmi(measurements.bmi),
    classifyGlucose(measurements),
    classifySpO2(measurements.oxygen_saturation),
    classifyPulse(measurements.pulse),
    classifyWaist(measurements.waist_circumference_cm, gender),
  ];

  for (const classification of checks) {
    if (classification?.isOutOfNormal) {
      findings.push({
        kind: 'measurement',
        label: classification.label,
        recommendation: '',
        severity: classification.severity === 'critical' ? 'critical' : 'attention',
      });
    }
  }

  return findings;
}

function buildAnamnesisFindings(
  anamnesis: ScreeningAnamnesis,
  measurements: MedicalMeasurements,
): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  if (measurements.known_hypertension === true) {
    findings.push({ kind: 'anamnesis', label: 'hypertension_known', recommendation: '', severity: 'attention' });
  }
  if (measurements.known_diabetes === true || anamnesis.known_diabetes === true) {
    findings.push({ kind: 'anamnesis', label: 'diabetes_known', recommendation: '', severity: 'attention' });
  }
  if (measurements.current_antihypertensive_treatment === true) {
    findings.push({ kind: 'anamnesis', label: 'antihypertensive_treatment', recommendation: '', severity: 'attention' });
  }
  if (anamnesis.smoking_status === 'current') {
    findings.push({ kind: 'anamnesis', label: 'smoking', recommendation: '', severity: 'attention' });
  }
  if (anamnesis.chest_pain === true) {
    findings.push({ kind: 'anamnesis', label: 'chest_pain', recommendation: '', severity: 'critical' });
  }
  if (anamnesis.dyspnea === true) {
    findings.push({ kind: 'anamnesis', label: 'dyspnea', recommendation: '', severity: 'attention' });
  }
  if (anamnesis.snoring === true) {
    findings.push({ kind: 'anamnesis', label: 'snoring', recommendation: '', severity: 'attention' });
  }

  return findings;
}

/** Builds participant-facing evaluation summary (single unified festival paragraph). */
export function buildDynamicEvaluationSummary(input: {
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  gender: PatientGender;
}): DynamicEvaluationResult {
  const measurementFindings = buildMeasurementFindings(input.measurements, input.gender);
  const anamnesisFindings = buildAnamnesisFindings(input.anamnesis, input.measurements);
  const findings = [...measurementFindings, ...anamnesisFindings];
  const hasCritical = findings.some((finding) => finding.severity === 'critical');

  return {
    summary: FESTIVAL_EVALUATION_SUMMARY,
    levelLabel: toFestivalEvaluationLevelLabel(findings.length > 0, hasCritical),
    findings,
  };
}
