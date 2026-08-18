import type {
  ClinicalRecommendation,
  MedicalMeasurements,
  PatientGender,
  ScreeningAnamnesis,
} from '@medscreen/types';
import { DEMO_CV_THRESHOLDS, DEMO_DIABETES_THRESHOLDS } from '../clinical/demo-rule-set';

const BP_URGENT_SYSTOLIC = 180;
const BP_URGENT_DIASTOLIC = 110;
const PULSE_LOW = 50;
const PULSE_HIGH = 100;
const SPO2_LOW = 95;
const BMI_ELEVATED = 25;
const WAIST_ELEVATED_MALE = 94;
const WAIST_ELEVATED_FEMALE = 80;

export interface PersonalizedRecommendationsInput {
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
  participant: { gender: PatientGender };
}

function addRecommendation(
  recommendations: ClinicalRecommendation[],
  seenCodes: Set<string>,
  recommendation: ClinicalRecommendation,
): void {
  if (seenCodes.has(recommendation.code)) {
    return;
  }
  seenCodes.add(recommendation.code);
  recommendations.push(recommendation);
}

function isBloodPressureExtremelyElevated(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null && measurements.systolic_bp >= BP_URGENT_SYSTOLIC) ||
    (measurements.diastolic_bp !== null && measurements.diastolic_bp >= BP_URGENT_DIASTOLIC)
  );
}

function isBloodPressureElevated(measurements: MedicalMeasurements): boolean {
  return (
    (measurements.systolic_bp !== null &&
      measurements.systolic_bp >= DEMO_CV_THRESHOLDS.elevatedSystolic) ||
    (measurements.diastolic_bp !== null &&
      measurements.diastolic_bp >= DEMO_CV_THRESHOLDS.elevatedDiastolic)
  );
}

function isGlucoseElevated(measurements: MedicalMeasurements): boolean {
  const glucose = measurements.blood_glucose;
  if (glucose === null) {
    return false;
  }

  if (measurements.blood_glucose_status === 'fasting') {
    return glucose >= DEMO_DIABETES_THRESHOLDS.fastingModerate;
  }

  if (measurements.blood_glucose_status === 'non_fasting') {
    return glucose >= DEMO_DIABETES_THRESHOLDS.nonFastingModerate;
  }

  return glucose >= DEMO_DIABETES_THRESHOLDS.fastingModerate;
}

function isWaistElevated(waistCm: number | null, gender: PatientGender): boolean {
  if (waistCm === null) {
    return false;
  }
  const threshold = gender === 'F' ? WAIST_ELEVATED_FEMALE : WAIST_ELEVATED_MALE;
  return waistCm >= threshold;
}

function addBloodPressureRecommendations(
  recommendations: ClinicalRecommendation[],
  seenCodes: Set<string>,
  measurements: MedicalMeasurements,
): void {
  if (isBloodPressureExtremelyElevated(measurements)) {
    addRecommendation(recommendations, seenCodes, {
      code: 'bp_urgent_evaluation',
      message:
        'Tensiunea arterială măsurată astăzi este foarte crescută. Vă recomandăm urgent o evaluare medicală cât mai curând posibil.',
      priority: 'urgent',
      category: 'cardiovascular',
    });
    return;
  }

  if (!isBloodPressureElevated(measurements)) {
    return;
  }

  addRecommendation(recommendations, seenCodes, {
    code: 'bp_repeat_monitoring',
    message:
      'Tensiunea arterială măsurată astăzi este crescută. Vă recomandăm să repetați măsurătorile dimineața și seara, după cel puțin 10 minute de repaus, timp de 5–7 zile consecutive, notând toate valorile.',
    priority: 'soon',
    category: 'cardiovascular',
  });

  addRecommendation(recommendations, seenCodes, {
    code: 'bp_specialist_referral',
    message:
      'Dacă valorile tensionale rămân crescute la măsurători repetate, programați o consultație la un medic cardiolog sau la un medic specialist în Medicină Internă.',
    priority: 'soon',
    category: 'cardiovascular',
  });
}

function addGlucoseRecommendations(
  recommendations: ClinicalRecommendation[],
  seenCodes: Set<string>,
  measurements: MedicalMeasurements,
  anamnesis: ScreeningAnamnesis,
): void {
  const knownDiabetes =
    anamnesis.known_diabetes === true || measurements.known_diabetes === true;

  if (knownDiabetes) {
    addRecommendation(recommendations, seenCodes, {
      code: 'known_diabetes_follow_up',
      message:
        'Având în vedere diabetul cunoscut, continuați monitorizarea glicemică și urmați recomandările medicului diabetolog. Programați controale periodice conform indicațiilor medicale.',
      priority: 'soon',
      category: 'diabetes',
    });
    return;
  }

  if (!isGlucoseElevated(measurements)) {
    return;
  }

  addRecommendation(recommendations, seenCodes, {
    code: 'glucose_repeat_testing',
    message:
      'Glicemia măsurată astăzi este crescută. Vă recomandăm repetarea glicemiei a jeun, dacă este posibil, și discutarea necesității determinării HbA1c cu medicul dumneavoastră.',
    priority: 'soon',
    category: 'diabetes',
  });

  addRecommendation(recommendations, seenCodes, {
    code: 'glucose_specialist_referral',
    message:
      'Dacă valorile glicemice rămân crescute, programați o consultație la un medic diabetolog sau la un medic specialist în Medicină Internă.',
    priority: 'soon',
    category: 'diabetes',
  });
}

function addHealthyParticipantRecommendations(
  recommendations: ClinicalRecommendation[],
  seenCodes: Set<string>,
): void {
  addRecommendation(recommendations, seenCodes, {
    code: 'healthy_congratulations',
    message:
      'Felicitări! Valorile măsurate astăzi nu indică anomalii importante în cadrul acestui screening.',
    priority: 'routine',
    category: 'general',
  });

  addRecommendation(recommendations, seenCodes, {
    code: 'healthy_habits',
    message:
      'Continuați să mențineți obiceiuri sănătoase: alimentație echilibrată, activitate fizică regulată, odihnă suficientă și evitarea fumatului.',
    priority: 'routine',
    category: 'general',
  });

  addRecommendation(recommendations, seenCodes, {
    code: 'healthy_preventive_screening',
    message:
      'Vă recomandăm screening medical preventiv periodic, conform vârstei și recomandărilor medicului dumneavoastră.',
    priority: 'routine',
    category: 'general',
  });
}

/**
 * Builds participant-facing recommendations from screening data.
 * Does not use generic engine recommendations — only data-supported guidance.
 */
export function buildPersonalizedParticipantRecommendations(
  input: PersonalizedRecommendationsInput,
): ClinicalRecommendation[] {
  const { measurements, anamnesis, participant } = input;
  const recommendations: ClinicalRecommendation[] = [];
  const seenCodes = new Set<string>();

  if (anamnesis.chest_pain === true) {
    addRecommendation(recommendations, seenCodes, {
      code: 'chest_pain_evaluation',
      message:
        'Ați raportat durere toracică. Vă recomandăm să solicitați o evaluare medicală promptă, fără amânare.',
      priority: 'urgent',
      category: 'general',
    });
  }

  if (anamnesis.dyspnea === true) {
    addRecommendation(recommendations, seenCodes, {
      code: 'dyspnea_evaluation',
      message:
        'Ați raportat dispnee (lipsă de aer). Vă recomandăm să solicitați o evaluare medicală promptă pentru investigarea simptomelor.',
      priority: 'soon',
      category: 'general',
    });
  }

  addBloodPressureRecommendations(recommendations, seenCodes, measurements);

  if (measurements.pulse !== null) {
    if (measurements.pulse < PULSE_LOW || measurements.pulse > PULSE_HIGH) {
      addRecommendation(recommendations, seenCodes, {
        code: 'pulse_evaluation',
        message: `Pulsul măsurat (${measurements.pulse} bpm) este în afara intervalului obișnuit de repaus. Vă recomandăm discutarea acestui rezultat cu un medic specialist.`,
        priority: 'soon',
        category: 'general',
      });
    }
  }

  if (measurements.oxygen_saturation !== null && measurements.oxygen_saturation < SPO2_LOW) {
    addRecommendation(recommendations, seenCodes, {
      code: 'spo2_evaluation',
      message: `Saturația de oxigen măsurată (${measurements.oxygen_saturation}%) este scăzută. Vă recomandăm o evaluare medicală, inclusiv consult de specialitate pulmonologică dacă este necesar.`,
      priority: 'soon',
      category: 'general',
    });
  }

  addGlucoseRecommendations(recommendations, seenCodes, measurements, anamnesis);

  if (measurements.bmi !== null && measurements.bmi >= BMI_ELEVATED) {
    addRecommendation(recommendations, seenCodes, {
      code: 'bmi_lifestyle',
      message:
        'Indicele de masă corporală (IMC) indică exces ponderal. Vă recomandăm alimentație echilibrată, activitate fizică regulată și reducerea treptată a greutății. Scăderea în greutate contribuie la reducerea riscului pentru inimă și vasele de sânge.',
      priority: 'routine',
      category: 'general',
    });
  }

  if (isWaistElevated(measurements.waist_circumference_cm, participant.gender)) {
    addRecommendation(recommendations, seenCodes, {
      code: 'waist_lifestyle',
      message:
        'Circumferința abdominală măsurată indică adipozitate abdominală, care crește riscul pentru inimă, metabolism și vasele de sânge. Vă recomandăm îmbunătățirea stilului de viață: alimentație sănătoasă și mișcare regulată.',
      priority: 'routine',
      category: 'general',
    });
  }

  if (anamnesis.smoking_status === 'current') {
    addRecommendation(recommendations, seenCodes, {
      code: 'smoking_cessation',
      message:
        'Fumatul crește semnificativ riscul pentru inimă, vase de sânge și plămâni. Vă încurajăm să renunțați la fumat și să solicitați sprijin medical pentru un program de renunțare.',
      priority: 'soon',
      category: 'general',
    });
  } else if (anamnesis.smoking_status === 'former') {
    addRecommendation(recommendations, seenCodes, {
      code: 'smoking_abstinence',
      message:
        'Felicitări pentru renunțarea la fumat. Vă încurajăm să mențineți abstinența — acest lucru protejează sănătatea inimii, plămânilor și a vaselor de sânge pe termen lung.',
      priority: 'routine',
      category: 'general',
    });
  }

  if (anamnesis.snoring === true) {
    addRecommendation(recommendations, seenCodes, {
      code: 'snoring_sleep_evaluation',
      message:
        'Sforăitul frecvent poate fi semn al unor tulburări de respirație în somn. Vă recomandăm o evaluare la un medic pneumolog sau într-un centru de medicina somnului.',
      priority: 'soon',
      category: 'sleep_apnea',
    });
  }

  if (recommendations.length === 0) {
    addHealthyParticipantRecommendations(recommendations, seenCodes);
  }

  return recommendations;
}

export function recommendationMessagesAreUnique(recommendations: ClinicalRecommendation[]): boolean {
  const messages = new Set<string>();
  for (const recommendation of recommendations) {
    if (messages.has(recommendation.message)) {
      return false;
    }
    messages.add(recommendation.message);
  }
  return true;
}
