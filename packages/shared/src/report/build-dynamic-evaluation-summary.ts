/**
 * Evidence-based dynamic "Evaluare și recomandări" text for participant reports.
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

function formatBpResult(measurements: MedicalMeasurements): string {
  const sys = measurements.systolic_bp;
  const dia = measurements.diastolic_bp;
  if (sys === null && dia === null) return '';
  return `${sys ?? '—'}/${dia ?? '—'} mmHg`;
}

function buildMeasurementFindings(
  measurements: MedicalMeasurements,
  gender: PatientGender,
): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  const bp = classifyBloodPressure(measurements);
  if (bp?.isOutOfNormal) {
    const value = formatBpResult(measurements);
    const recommendation =
      bp.label === 'Hipotensiune'
        ? 'Dacă apar amețeli sau oboseală, discutați cu medicul și mențineți hidratarea corespunzătoare.'
        : bp.severity === 'critical'
          ? 'Recomandăm evaluare medicală promptă și monitorizarea tensiunii conform indicațiilor medicului.'
          : 'Recomandăm un control la medicul de familie în următoarele săptămâni.';
    findings.push({
      kind: 'measurement',
      label: `Tensiune arterială (${value}) — ${bp.label}`,
      recommendation,
      severity: bp.severity === 'critical' ? 'critical' : 'attention',
    });
  }

  const bmi = classifyBmi(measurements.bmi);
  if (bmi?.isOutOfNormal) {
    findings.push({
      kind: 'measurement',
      label: `IMC (${measurements.bmi?.toFixed(1) ?? '—'}) — ${bmi.label}`,
      recommendation:
        bmi.label === 'Subponderal'
          ? 'Discutați cu medicul despre alimentație echilibrată și eventuale cauze ale greutății scăzute.'
          : 'Recomandăm discuție cu medicul despre obiceiuri alimentare, activitate fizică și monitorizarea greutății.',
      severity: bmi.severity === 'critical' ? 'critical' : 'attention',
    });
  }

  const glucose = classifyGlucose(measurements);
  if (glucose?.isOutOfNormal) {
    const context =
      measurements.blood_glucose_status === 'non_fasting' ? 'postprandial' : 'á jeun';
    findings.push({
      kind: 'measurement',
      label: `Glicemie (${measurements.blood_glucose} mg/dL, ${context}) — ${glucose.label}`,
      recommendation:
        glucose.severity === 'critical'
          ? 'Recomandăm confirmarea valorii și evaluare medicală, inclusiv analize de laborator.'
          : 'Recomandăm repetarea măsurătorii în condiții standardizate și discuție cu medicul de familie.',
      severity: glucose.severity === 'critical' ? 'critical' : 'attention',
    });
  }

  const spo2 = classifySpO2(measurements.oxygen_saturation);
  if (spo2?.isOutOfNormal) {
    findings.push({
      kind: 'measurement',
      label: `SpO₂ (${measurements.oxygen_saturation}%) — ${spo2.label}`,
      recommendation:
        spo2.severity === 'critical'
          ? 'Recomandăm evaluare medicală urgentă, mai ales dacă apar simptome respiratorii.'
          : 'Recomandăm discuție cu medicul, mai ales dacă există și alte simptome respiratorii.',
      severity: spo2.severity === 'critical' ? 'critical' : 'attention',
    });
  }

  const pulse = classifyPulse(measurements.pulse);
  if (pulse?.isOutOfNormal) {
    findings.push({
      kind: 'measurement',
      label: `Puls (${measurements.pulse} bpm) — ${pulse.label}`,
      recommendation:
        'Recomandăm o verificare medicală de rutină, mai ales dacă apar palpitații, amețeli sau lipsă de aer.',
      severity: 'attention',
    });
  }

  const waist = classifyWaist(measurements.waist_circumference_cm, gender);
  if (waist?.isOutOfNormal) {
    findings.push({
      kind: 'measurement',
      label: `Circumferință abdominală (${measurements.waist_circumference_cm} cm) — ${waist.label}`,
      recommendation:
        'Recomandăm discuție cu medicul despre riscul cardiometabolic și măsuri de stil de viață.',
      severity: 'attention',
    });
  }

  return findings;
}

function buildAnamnesisFindings(
  anamnesis: ScreeningAnamnesis,
  measurements: MedicalMeasurements,
): EvaluationFinding[] {
  const findings: EvaluationFinding[] = [];

  if (measurements.known_hypertension === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Hipertensiune arterială cunoscută (declarată)',
      recommendation:
        'Continuați monitorizarea și tratamentul conform indicațiilor medicului; valorile de azi se interpretează în acest context.',
      severity: 'attention',
    });
  }

  if (measurements.known_diabetes === true || anamnesis.known_diabetes === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Diabet cunoscut (declarat)',
      recommendation:
        'Valorile de azi trebuie interpretate împreună cu planul de tratament existent; recomandăm discuție de rutină cu medicul curant.',
      severity: 'attention',
    });
  }

  if (measurements.current_antihypertensive_treatment === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Tratament antihipertensiv curent (declarat)',
      recommendation:
        'Respectați tratamentul prescris și discutați orice modificare a valorilor cu medicul care vă monitorizează tensiunea.',
      severity: 'attention',
    });
  }

  if (anamnesis.smoking_status === 'current') {
    findings.push({
      kind: 'anamnesis',
      label: 'Fumător activ (declarat)',
      recommendation:
        'Renunțarea la fumat, chiar treptat, reduce semnificativ riscul cardiovascular — discutați opțiuni de sprijin cu medicul.',
      severity: 'attention',
    });
  }

  if (anamnesis.chest_pain === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Durere/disconfort toracic (declarat)',
      recommendation:
        'Orice simptom toracic merită evaluare medicală, chiar dacă valorile măsurate astăzi par normale.',
      severity: 'critical',
    });
  }

  if (anamnesis.dyspnea === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Lipsă de aer / dispnee (declarată)',
      recommendation:
        'Recomandăm evaluare medicală, mai ales dacă simptomul apare la efort sau se agravează.',
      severity: 'attention',
    });
  }

  if (anamnesis.snoring === true) {
    findings.push({
      kind: 'anamnesis',
      label: 'Sforăit frecvent (declarat)',
      recommendation:
        'Poate afecta calitatea somnului; discutați cu medicul despre evaluarea riscului de apnee în somn.',
      severity: 'attention',
    });
  }

  return findings;
}

function deriveLevelLabel(findings: EvaluationFinding[]): string {
  if (findings.length === 0) return 'NORMAL';
  if (findings.some((finding) => finding.severity === 'critical')) return 'ATENȚIE RIDICATĂ';
  return 'ATENȚIE';
}

function composeSummary(findings: EvaluationFinding[]): string {
  if (findings.length === 0) {
    return (
      'Valorile măsurate astăzi se încadrează în limite normale. ' +
      'Continuați un stil de viață echilibrat, cu alimentație sănătoasă și mișcare regulată. ' +
      'Recomandăm controale preventive periodice la medicul de familie.'
    );
  }

  const intro =
    findings.length === 1
      ? 'La evaluarea de astăzi am identificat următorul aspect:'
      : 'La evaluarea de astăzi am identificat următoarele aspecte:';

  const body = findings
    .map((finding) => `${finding.label}. ${finding.recommendation}`)
    .join(' ');

  const combinedNote =
    findings.length >= 2
      ? ' Prezența mai multor factori simultan poate necesita o evaluare medicală mai atentă decât fiecare aspect luat separat.'
      : '';

  return `${intro} ${body}${combinedNote}`;
}

/** Builds participant-facing evaluation summary strictly from measured values and declared history. */
export function buildDynamicEvaluationSummary(input: {
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  gender: PatientGender;
}): DynamicEvaluationResult {
  const measurementFindings = buildMeasurementFindings(input.measurements, input.gender);
  const anamnesisFindings = buildAnamnesisFindings(input.anamnesis, input.measurements);
  const findings = [...measurementFindings, ...anamnesisFindings];

  return {
    summary: composeSummary(findings),
    levelLabel: deriveLevelLabel(findings),
    findings,
  };
}
