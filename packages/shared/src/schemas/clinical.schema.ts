import { z } from 'zod';
import { medicalMeasurementsFieldsSchema, medicalMeasurementsSchema } from './measurements.schema';

export const screeningAnamnesisSchema = z.object({
  smoking_status: z.enum(['never', 'former', 'current', '']).default(''),
  alcohol_consumption: z.enum(['none', 'occasional', 'regular', '']).default(''),
  known_diabetes: z.boolean().nullable().optional().default(null),
  chest_pain: z.boolean().nullable().optional().default(null),
  dyspnea: z.boolean().nullable().optional().default(null),
  snoring: z.boolean().nullable().optional().default(null),
  current_treatment: z.string().default(''),
  free_notes: z.string().default(''),
});

export const clinicalEngineInputSchema = z.object({
  patient_id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  screening_id: z.string().uuid(),
  measurements: medicalMeasurementsSchema,
  captured_at: z.string().min(1),
});

export const clinicalEvaluationResultSchema = z.object({
  engine_version: z.string().min(1),
  rule_set_id: z.string().min(1),
  is_demo: z.boolean(),
  evaluated_at: z.string().min(1),
  screening_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  risks: z.record(z.unknown()),
  warnings: z.array(z.unknown()),
  recommendations: z.array(z.unknown()),
  interpretation: z.object({
    summary: z.string(),
    sections: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
      }),
    ),
  }),
});

export const clinicalEvaluationRequestSchema = z.object({
  clinical_engine_input: clinicalEngineInputSchema,
  patient: z.object({
    age: z.number().int().min(1).max(120),
    gender: z.enum(['M', 'F']),
  }),
  anamnesis: screeningAnamnesisSchema,
  previous_measurements: medicalMeasurementsFieldsSchema.partial().nullable().optional(),
});

export type ClinicalEvaluationRequestInput = z.infer<typeof clinicalEvaluationRequestSchema>;
