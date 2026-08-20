import type { ClinicalWarning } from '@medscreen/types';
import type { MedicalMeasurements, PatientGender, ScreeningAnamnesis } from '@medscreen/types';

import { CLINICAL_THRESHOLDS } from '@medscreen/shared';

import type { OperatorAlertGuideKey } from './operator-conversation-guide-copy';

function isBloodPressureElevated(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null &&
      measurements.systolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.elevatedSystolic) ||
    (measurements.diastolic_bp !== null &&
      measurements.diastolic_bp >= CLINICAL_THRESHOLDS.bloodPressure.elevatedDiastolic)
  );
}

function isGlucoseElevated(measurements: MedicalMeasurements): boolean {
  const glucose = measurements.blood_glucose;
  if (glucose === null) return false;

  if (measurements.blood_glucose_status === 'fasting') {
    return glucose >= CLINICAL_THRESHOLDS.glucose.fastingModerate;
  }
  if (measurements.blood_glucose_status === 'non_fasting') {
    return glucose >= CLINICAL_THRESHOLDS.glucose.nonFastingModerate;
  }
  return glucose >= CLINICAL_THRESHOLDS.glucose.fastingModerate;
}

function isSpO2Low(spo2: number | null): boolean {
  return spo2 !== null && spo2 < CLINICAL_THRESHOLDS.spo2.low;
}

function isPulseAbnormal(measurements: MedicalMeasurements): boolean {
  const pulse = measurements.pulse;
  if (pulse === null) return false;
  return pulse < CLINICAL_THRESHOLDS.pulse.low || pulse > CLINICAL_THRESHOLDS.pulse.high;
}

function isBmiElevated(bmi: number | null): boolean {
  return bmi !== null && bmi >= CLINICAL_THRESHOLDS.bmi.elevated;
}

function isWaistElevated(waistCm: number | null, gender: PatientGender): boolean {
  if (waistCm === null) return false;
  return waistCm >= CLINICAL_THRESHOLDS.waist[gender === 'F' ? 'female' : 'male'];
}

export interface OperatorSupplementaryAlert {
  code: string;
  message: string;
  severity: ClinicalWarning['severity'];
  guideKey: OperatorAlertGuideKey;
}

const OBSERVATION_CHECKS: Array<{
  guideKey: OperatorAlertGuideKey;
  message: string;
  matches: (input: {
    measurements: MedicalMeasurements;
    anamnesis: ScreeningAnamnesis;
    gender: PatientGender;
  }) => boolean;
}> = [
  {
    guideKey: 'high_blood_pressure',
    message: 'Tensiune arterială crescută',
    matches: ({ measurements }) => isBloodPressureElevated(measurements),
  },
  {
    guideKey: 'high_glucose',
    message: 'Glicemie crescută',
    matches: ({ measurements }) => isGlucoseElevated(measurements),
  },
  {
    guideKey: 'low_spo2',
    message: 'Saturație de oxigen sub normal',
    matches: ({ measurements }) => isSpO2Low(measurements.oxygen_saturation),
  },
  {
    guideKey: 'abnormal_pulse',
    message: 'Puls în afara intervalului obișnuit',
    matches: ({ measurements }) => isPulseAbnormal(measurements),
  },
  {
    guideKey: 'bmi',
    message: 'Exces ponderal',
    matches: ({ measurements, gender }) =>
      isBmiElevated(measurements.bmi) ||
      isWaistElevated(measurements.waist_circumference_cm, gender),
  },
  {
    guideKey: 'smoking',
    message: 'Fumat declarat',
    matches: ({ anamnesis }) => anamnesis.smoking_status === 'current',
  },
  {
    guideKey: 'chest_pain',
    message: 'Durere în piept declarată',
    matches: ({ anamnesis }) => anamnesis.chest_pain === true,
  },
  {
    guideKey: 'dyspnea',
    message: 'Lipsă de aer declarată',
    matches: ({ anamnesis }) => anamnesis.dyspnea === true,
  },
  {
    guideKey: 'snoring',
    message: 'Sforăit frecvent declarat',
    matches: ({ anamnesis }) => anamnesis.snoring === true,
  },
];

/** Measurement/anamnesis alerts not always present in engine warnings — operator UI only. */
export function buildSupplementaryOperatorAlerts(input: {
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  participantGender: PatientGender;
  coveredGuideKeys: Set<OperatorAlertGuideKey>;
}): OperatorSupplementaryAlert[] {
  const extras: OperatorSupplementaryAlert[] = [];

  for (const check of OBSERVATION_CHECKS) {
    if (input.coveredGuideKeys.has(check.guideKey)) {
      continue;
    }

    if (
      !check.matches({
        measurements: input.measurements,
        anamnesis: input.anamnesis,
        gender: input.participantGender,
      })
    ) {
      continue;
    }

    extras.push({
      code: `operator_${check.guideKey}`,
      message: check.message,
      severity: 'attention',
      guideKey: check.guideKey,
    });
    input.coveredGuideKeys.add(check.guideKey);
  }

  if (
    input.anamnesis.known_diabetes === true &&
    !input.coveredGuideKeys.has('known_diabetes')
  ) {
    extras.push({
      code: 'operator_known_diabetes',
      message: 'Diabet cunoscut (raportat)',
      severity: 'attention',
      guideKey: 'known_diabetes',
    });
    input.coveredGuideKeys.add('known_diabetes');
  }

  return extras;
}
