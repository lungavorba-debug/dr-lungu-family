import { z } from 'zod';
import {
  CLINICAL_RULE_CATEGORIES,
  CLINICAL_RULE_SEVERITIES,
  CLINICAL_RULE_TYPES,
} from '@medscreen/types';
import { clinicalEvaluationRequestSchema } from './clinical.schema';

export const VALID_THRESHOLD_KEYS = [
  'bloodPressure.elevatedSystolic',
  'bloodPressure.elevatedDiastolic',
  'bloodPressure.moderateSystolic',
  'bloodPressure.moderateDiastolic',
  'bloodPressure.urgentSystolic',
  'bloodPressure.urgentDiastolic',
  'bloodPressure.lowSystolic',
  'pulse.low',
  'pulse.high',
  'spo2.low',
  'bmi.elevated',
  'bmi.moderate',
  'bmi.elevatedObesity',
  'waist.male',
  'waist.female',
  'glucose.low',
  'glucose.fastingModerate',
  'glucose.fastingElevated',
  'glucose.nonFastingModerate',
  'glucose.nonFastingElevated',
  'sleepApnea.elevatedBmi',
] as const;

export type ValidThresholdKey = (typeof VALID_THRESHOLD_KEYS)[number];

const clinicalRuleCategorySchema = z.enum([
  CLINICAL_RULE_CATEGORIES.CARDIOVASCULAR,
  CLINICAL_RULE_CATEGORIES.DIABETES,
  CLINICAL_RULE_CATEGORIES.SLEEP_APNEA,
  CLINICAL_RULE_CATEGORIES.MEASUREMENTS,
  CLINICAL_RULE_CATEGORIES.ANAMNESIS,
  CLINICAL_RULE_CATEGORIES.GENERAL,
]);

const clinicalRuleSeveritySchema = z.enum([
  CLINICAL_RULE_SEVERITIES.INFO,
  CLINICAL_RULE_SEVERITIES.ATTENTION,
  CLINICAL_RULE_SEVERITIES.CRITICAL,
  CLINICAL_RULE_SEVERITIES.MODERATE,
  CLINICAL_RULE_SEVERITIES.ELEVATED,
]);

const clinicalRuleTypeSchema = z.enum([
  CLINICAL_RULE_TYPES.THRESHOLD,
  CLINICAL_RULE_TYPES.ANAMNESIS,
  CLINICAL_RULE_TYPES.RECOMMENDATION,
]);

export const createClinicalRuleSchema = z
  .object({
    code: z
      .string()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9._-]+$/, 'Codul trebuie să conțină doar litere mici, cifre, punct, cratimă sau underscore.'),
    name: z.string().min(2).max(200),
    category: clinicalRuleCategorySchema,
    severity: clinicalRuleSeveritySchema,
    rule_type: clinicalRuleTypeSchema,
    threshold_key: z.enum(VALID_THRESHOLD_KEYS).nullable().optional(),
    threshold_value: z.number().finite().nullable().optional(),
    threshold_unit: z.string().max(20).nullable().optional(),
    recommendation_text: z.string().max(2000).nullable().optional(),
    enabled: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.rule_type === CLINICAL_RULE_TYPES.THRESHOLD) {
      if (!data.threshold_key) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['threshold_key'],
          message: 'Pragul necesită o cheie de threshold.',
        });
      }
      if (data.threshold_value === undefined || data.threshold_value === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['threshold_value'],
          message: 'Pragul necesită o valoare numerică.',
        });
      }
    }

    if (data.rule_type === CLINICAL_RULE_TYPES.RECOMMENDATION) {
      if (!data.recommendation_text?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['recommendation_text'],
          message: 'Recomandarea necesită text.',
        });
      }
    }
  });

export const updateClinicalRuleSchema = z
  .object({
    name: z.string().min(2).max(200).optional(),
    category: clinicalRuleCategorySchema.optional(),
    severity: clinicalRuleSeveritySchema.optional(),
    threshold_value: z.number().finite().nullable().optional(),
    threshold_unit: z.string().max(20).nullable().optional(),
    recommendation_text: z.string().max(2000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Trebuie furnizat cel puțin un câmp de actualizat.',
  });

export const listClinicalRulesQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  category: clinicalRuleCategorySchema.optional(),
  enabled: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const listClinicalRuleChangesQuerySchema = z.object({
  rule_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const previewClinicalEvaluationSchema = clinicalEvaluationRequestSchema;

export type CreateClinicalRuleInput = z.infer<typeof createClinicalRuleSchema>;
export type UpdateClinicalRuleInput = z.infer<typeof updateClinicalRuleSchema>;
