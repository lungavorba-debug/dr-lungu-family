import { z } from 'zod';

const screeningAnamnesisSchema = z.object({
  smoking_status: z.enum(['never', 'former', 'current', '']).default(''),
  alcohol_consumption: z.enum(['none', 'occasional', 'regular', '']).default(''),
  known_diabetes: z.boolean().nullable().optional().default(null),
  chest_pain: z.boolean().nullable().optional().default(null),
  dyspnea: z.boolean().nullable().optional().default(null),
  snoring: z.boolean().nullable().optional().default(null),
  current_treatment: z.string().default(''),
  free_notes: z.string().default(''),
});


const optionalInt = (min: number, max: number, label: string) =>

  z

    .union([z.string(), z.number(), z.null()])

    .optional()

    .transform((value) => {

      if (value === null || value === undefined || value === '') return null;

      const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);

      return Number.isNaN(parsed) ? null : parsed;

    })

    .refine((value) => value === null || (value >= min && value <= max), {

      message: `${label} trebuie să fie între ${min} și ${max}.`,

    });



const optionalDecimal = (min: number, max: number, label: string) =>

  z

    .union([z.string(), z.number(), z.null()])

    .optional()

    .transform((value) => {

      if (value === null || value === undefined || value === '') return null;

      const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value).replace(',', '.'));

      return Number.isNaN(parsed) ? null : parsed;

    })

    .refine((value) => value === null || (value >= min && value <= max), {

      message: `${label} trebuie să fie între ${min} și ${max}.`,

    });



export const BLOOD_PRESSURE_ORDER_ERROR_MESSAGE =
  'Tensiunea sistolică trebuie să fie strict mai mare decât cea diastolică.';

export const medicalMeasurementsFieldsSchema = z.object({

  systolic_bp: optionalInt(40, 300, 'Tensiunea sistolică'),

  diastolic_bp: optionalInt(20, 200, 'Tensiunea diastolică'),

  pulse: optionalInt(20, 250, 'Pulsul'),

  oxygen_saturation: optionalInt(50, 100, 'Saturația de oxigen'),

  blood_glucose: optionalInt(20, 600, 'Glicemia'),

  blood_glucose_status: z.enum(['fasting', 'non_fasting', '']).default(''),

  weight_kg: optionalDecimal(15, 300, 'Greutatea'),

  height_cm: optionalDecimal(40, 250, 'Înălțimea'),

  bmi: optionalDecimal(10, 100, 'IMC'),

  ideal_weight_kg: optionalDecimal(15, 300, 'Greutatea ideală'),

  waist_circumference_cm: optionalInt(30, 250, 'Circumferința abdominală'),

  known_hypertension: z.boolean().nullable().optional().default(null),

  known_diabetes: z.boolean().nullable().optional().default(null),

  current_antihypertensive_treatment: z.boolean().nullable().optional().default(null),

});

export const medicalMeasurementsSchema = medicalMeasurementsFieldsSchema.refine(
  (data) => {
    if (data.systolic_bp !== null && data.diastolic_bp !== null) {
      return data.systolic_bp > data.diastolic_bp;
    }
    return true;
  },
  {
    message: BLOOD_PRESSURE_ORDER_ERROR_MESSAGE,
    path: ['systolic_bp'],
  },
);



export const saveMeasurementsSchema = z.object({
  campaign_id: z.string().uuid('ID campanie invalid.'),
  patient_id: z.string().uuid('ID pacient invalid.'),
  measurements: medicalMeasurementsSchema,
  ai_session_id: z.string().uuid('ID sesiune AI invalid.').optional(),
  anamnesis: screeningAnamnesisSchema.optional(),
});



export type SaveMeasurementsInput = z.infer<typeof saveMeasurementsSchema>;

export type MedicalMeasurementsInput = z.infer<typeof medicalMeasurementsSchema>;



export interface MeasurementWarning {

  field: string;

  message: string;

}



export const UNUSUAL_MEASUREMENT_VALUE_MESSAGE =

  'Valoare neobișnuită. Verificați dacă măsurătoarea este corectă.';

export function getBloodPressureOrderError(
  measurements: MedicalMeasurementsInput,
): MeasurementWarning | null {
  const { systolic_bp, diastolic_bp } = measurements;
  if (
    systolic_bp !== null &&
    diastolic_bp !== null &&
    systolic_bp <= diastolic_bp
  ) {
    return { field: 'systolic_bp', message: BLOOD_PRESSURE_ORDER_ERROR_MESSAGE };
  }
  return null;
}

export function getMeasurementWarnings(

  measurements: MedicalMeasurementsInput,

): MeasurementWarning[] {

  const warnings: MeasurementWarning[] = [];

  const seenFields = new Set<string>();



  function pushWarning(field: string, condition: boolean): void {

    if (!condition || seenFields.has(field)) return;

    seenFields.add(field);

    warnings.push({ field, message: UNUSUAL_MEASUREMENT_VALUE_MESSAGE });

  }



  if (measurements.systolic_bp !== null) {

    pushWarning('systolic_bp', measurements.systolic_bp > 180 || measurements.systolic_bp < 80);

  }



  if (measurements.pulse !== null) {

    pushWarning('pulse', measurements.pulse > 180 || measurements.pulse < 40);

  }



  if (measurements.blood_glucose !== null) {

    pushWarning('blood_glucose', measurements.blood_glucose > 300 || measurements.blood_glucose < 60);

  }



  return warnings;

}



export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {

  if (weightKg === null || heightCm === null || heightCm <= 0) return null;

  const heightM = heightCm / 100;

  const bmi = weightKg / (heightM * heightM);

  return Math.round(bmi * 100) / 100;

}



/** Devine formula — ideal body weight from height (cm) and sex. */
export function calculateIdealWeight(
  heightCm: number | null,
  gender: 'M' | 'F' | null | undefined,
): number | null {
  if (heightCm === null || heightCm <= 0 || !gender) return null;

  const base = gender === 'M' ? 50 : 45.5;
  const ideal = base + 0.9 * (heightCm - 152);

  return Math.round(ideal * 100) / 100;
}


