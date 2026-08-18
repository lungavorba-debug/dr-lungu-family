/** Single clinical threshold registry — used by participant-view and demo rule modules. */

export const CLINICAL_THRESHOLDS = {
  bloodPressure: {
    elevatedSystolic: 140,
    elevatedDiastolic: 90,
    moderateSystolic: 130,
    moderateDiastolic: 85,
    urgentSystolic: 180,
    urgentDiastolic: 110,
    lowSystolic: 90,
  },
  pulse: {
    low: 60,
    high: 100,
  },
  spo2: {
    low: 95,
  },
  bmi: {
    elevated: 25,
    moderate: 25,
    elevatedObesity: 30,
  },
  waist: {
    male: 94,
    female: 80,
  },
  glucose: {
    low: 70,
    fastingModerate: 100,
    fastingElevated: 126,
    nonFastingModerate: 140,
    nonFastingElevated: 200,
  },
  sleepApnea: {
    elevatedBmi: 30,
  },
} as const;

/** @deprecated Import CLINICAL_THRESHOLDS — retained for existing demo rule imports. */
export const DEMO_CV_THRESHOLDS = {
  elevatedSystolic: CLINICAL_THRESHOLDS.bloodPressure.elevatedSystolic,
  elevatedDiastolic: CLINICAL_THRESHOLDS.bloodPressure.elevatedDiastolic,
  moderateSystolic: CLINICAL_THRESHOLDS.bloodPressure.moderateSystolic,
  moderateDiastolic: CLINICAL_THRESHOLDS.bloodPressure.moderateDiastolic,
  elevatedBmi: CLINICAL_THRESHOLDS.bmi.elevatedObesity,
  moderateBmi: CLINICAL_THRESHOLDS.bmi.moderate,
} as const;

/** @deprecated Import CLINICAL_THRESHOLDS — retained for existing demo rule imports. */
export const DEMO_DIABETES_THRESHOLDS = {
  fastingElevated: CLINICAL_THRESHOLDS.glucose.fastingElevated,
  fastingModerate: CLINICAL_THRESHOLDS.glucose.fastingModerate,
  nonFastingElevated: CLINICAL_THRESHOLDS.glucose.nonFastingElevated,
  nonFastingModerate: CLINICAL_THRESHOLDS.glucose.nonFastingModerate,
} as const;

/** @deprecated Import CLINICAL_THRESHOLDS — retained for existing demo rule imports. */
export const DEMO_SLEEP_APNEA_SIGNALS = {
  elevatedBmi: CLINICAL_THRESHOLDS.sleepApnea.elevatedBmi,
} as const;
