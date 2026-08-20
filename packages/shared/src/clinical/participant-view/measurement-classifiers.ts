/**
 * Participant-facing measurement classification (ESC/ESH, WHO, ADA, IDF).
 * See ../thresholds/clinical-threshold-references.md for guideline sources.
 */
import type { MedicalMeasurements, PatientGender } from '@medscreen/types';

export type MeasurementBadgeLevel = 'normal' | 'attention' | 'critical' | 'neutral';

export type MeasurementCategorySeverity = 'normal' | 'attention' | 'critical';

export interface MeasurementClassification {
  label: string;
  badgeLevel: MeasurementBadgeLevel;
  referenceRange: string;
  severity: MeasurementCategorySeverity;
  isOutOfNormal: boolean;
}

const BP_REF = '120/80–129/84 mmHg (optimă <120/<80)';

function worseSeverity(
  left: MeasurementCategorySeverity,
  right: MeasurementCategorySeverity,
): MeasurementCategorySeverity {
  const order: MeasurementCategorySeverity[] = ['normal', 'attention', 'critical'];
  return order.indexOf(right) > order.indexOf(left) ? right : left;
}

function pickBpClassification(
  sys: number | null,
  dia: number | null,
): MeasurementClassification {
  let label = 'Optimă';
  let badgeLevel: MeasurementBadgeLevel = 'normal';
  let severity: MeasurementCategorySeverity = 'normal';
  let isOutOfNormal = false;

  const apply = (
    nextLabel: string,
    nextBadge: MeasurementBadgeLevel,
    nextSeverity: MeasurementCategorySeverity,
  ) => {
    if (worseSeverity(severity, nextSeverity) === nextSeverity) {
      label = nextLabel;
      badgeLevel = nextBadge;
      severity = nextSeverity;
      isOutOfNormal = nextSeverity !== 'normal';
    }
  };

  if ((sys !== null && sys < 90) || (dia !== null && dia < 60)) {
    apply('Hipotensiune', 'attention', 'attention');
  }
  if ((sys !== null && sys >= 180) || (dia !== null && dia >= 110)) {
    apply('Hipertensiune grad 3', 'critical', 'critical');
  } else if ((sys !== null && sys >= 160) || (dia !== null && dia >= 100)) {
    apply('Hipertensiune grad 2', 'critical', 'critical');
  } else if ((sys !== null && sys >= 140) || (dia !== null && dia >= 90)) {
    apply('Hipertensiune grad 1', 'attention', 'attention');
  } else if ((sys !== null && sys >= 130) || (dia !== null && dia >= 85)) {
    apply('Normal-înaltă', 'attention', 'attention');
  } else if ((sys !== null && sys >= 120) || (dia !== null && dia >= 80)) {
    apply('Normală', 'normal', 'normal');
  }

  return {
    label,
    badgeLevel,
    referenceRange: BP_REF,
    severity,
    isOutOfNormal,
  };
}

/** ESC/ESH blood pressure categories. */
export function classifyBloodPressure(measurements: MedicalMeasurements): MeasurementClassification | null {
  if (measurements.systolic_bp === null && measurements.diastolic_bp === null) {
    return null;
  }

  return pickBpClassification(measurements.systolic_bp, measurements.diastolic_bp);
}

/** WHO BMI categories. */
export function classifyBmi(bmi: number | null): MeasurementClassification | null {
  if (bmi === null) return null;

  if (bmi < 18.5) {
    return {
      label: 'Subponderal',
      badgeLevel: 'attention',
      referenceRange: '18,5–24,9',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }
  if (bmi < 25) {
    return {
      label: 'Normal',
      badgeLevel: 'normal',
      referenceRange: '18,5–24,9',
      severity: 'normal',
      isOutOfNormal: false,
    };
  }
  if (bmi < 30) {
    return {
      label: 'Supraponderal',
      badgeLevel: 'attention',
      referenceRange: '18,5–24,9',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }
  if (bmi < 35) {
    return {
      label: 'Obezitate grad I',
      badgeLevel: 'attention',
      referenceRange: '18,5–24,9',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }
  if (bmi < 40) {
    return {
      label: 'Obezitate grad II',
      badgeLevel: 'attention',
      referenceRange: '18,5–24,9',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  return {
    label: 'Obezitate grad III',
    badgeLevel: 'critical',
    referenceRange: '18,5–24,9',
    severity: 'critical',
    isOutOfNormal: true,
  };
}

/** ADA fasting / postprandial glucose categories. */
export function classifyGlucose(measurements: MedicalMeasurements): MeasurementClassification | null {
  const glucose = measurements.blood_glucose;
  if (glucose === null) return null;

  const isNonFasting = measurements.blood_glucose_status === 'non_fasting';

  if (glucose < 70) {
    return {
      label: 'Scăzută',
      badgeLevel: 'attention',
      referenceRange: isNonFasting ? 'postprandial <140' : 'á jeun <100',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  if (isNonFasting) {
    if (glucose >= 200) {
      return {
        label: 'Sugestiv diabet (postprandial)',
        badgeLevel: 'critical',
        referenceRange: 'postprandial <140',
        severity: 'critical',
        isOutOfNormal: true,
      };
    }
    if (glucose >= 140) {
      return {
        label: 'Toleranță alterată (postprandial)',
        badgeLevel: 'attention',
        referenceRange: 'postprandial <140',
        severity: 'attention',
        isOutOfNormal: true,
      };
    }
    return {
      label: 'Normală (postprandial)',
      badgeLevel: 'normal',
      referenceRange: 'postprandial <140',
      severity: 'normal',
      isOutOfNormal: false,
    };
  }

  if (glucose >= 126) {
    return {
      label: 'Sugestiv diabet (á jeun)',
      badgeLevel: 'critical',
      referenceRange: 'á jeun <100',
      severity: 'critical',
      isOutOfNormal: true,
    };
  }
  if (glucose >= 100) {
    return {
      label: 'Prediabet (á jeun)',
      badgeLevel: 'attention',
      referenceRange: 'á jeun <100',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  return {
    label: 'Normală (á jeun)',
    badgeLevel: 'normal',
    referenceRange: 'á jeun <100',
    severity: 'normal',
    isOutOfNormal: false,
  };
}

/** SpO₂ categories. */
export function classifySpO2(spo2: number | null): MeasurementClassification | null {
  if (spo2 === null) return null;

  if (spo2 < 90) {
    return {
      label: 'Sever scăzută',
      badgeLevel: 'critical',
      referenceRange: '≥95%',
      severity: 'critical',
      isOutOfNormal: true,
    };
  }
  if (spo2 < 95) {
    return {
      label: 'Ușor scăzută',
      badgeLevel: 'attention',
      referenceRange: '≥95%',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  return {
    label: 'Normală',
    badgeLevel: 'normal',
    referenceRange: '≥95%',
    severity: 'normal',
    isOutOfNormal: false,
  };
}

/** Resting pulse categories. */
export function classifyPulse(pulse: number | null): MeasurementClassification | null {
  if (pulse === null) return null;

  if (pulse < 60) {
    return {
      label: 'Bradicardie',
      badgeLevel: 'attention',
      referenceRange: '60–100',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }
  if (pulse > 100) {
    return {
      label: 'Tahicardie',
      badgeLevel: 'attention',
      referenceRange: '60–100',
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  return {
    label: 'Normal',
    badgeLevel: 'normal',
    referenceRange: '60–100',
    severity: 'normal',
    isOutOfNormal: false,
  };
}

/** IDF waist circumference cardiometabolic risk. */
export function classifyWaist(
  waistCm: number | null,
  gender: PatientGender,
): MeasurementClassification | null {
  if (waistCm === null) return null;

  const isFemale = gender === 'F';
  const normalMax = isFemale ? 80 : 94;
  const veryHighMin = isFemale ? 88 : 102;
  const ref = isFemale ? 'F: <80 / 80–87,9 / ≥88 cm' : 'M: <94 / 94–101,9 / ≥102 cm';

  if (waistCm >= veryHighMin) {
    return {
      label: 'Risc foarte crescut',
      badgeLevel: 'attention',
      referenceRange: ref,
      severity: 'attention',
      isOutOfNormal: true,
    };
  }
  if (waistCm >= normalMax) {
    return {
      label: 'Risc crescut',
      badgeLevel: 'attention',
      referenceRange: ref,
      severity: 'attention',
      isOutOfNormal: true,
    };
  }

  return {
    label: 'Normală',
    badgeLevel: 'normal',
    referenceRange: ref,
    severity: 'normal',
    isOutOfNormal: false,
  };
}
