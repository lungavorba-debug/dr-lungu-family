import { z } from 'zod';
import {
  clinicalEvaluationResultSchema,
  screeningAnamnesisSchema,
} from './clinical.schema';

const participantReportMetadataSchema = z.object({
  report_id: z.string().uuid(),
  report_number: z.string().min(1),
  report_title: z.string().min(1),
  generated_at: z.string().min(1),
  engine_version: z.string().min(1),
  rule_set_id: z.string().min(1),
  report_composer_version: z.string().min(1),
  filename: z.string().min(1),
  screening_date: z.object({
    iso: z.string().min(1),
    date_line: z.string().min(1),
    time_line: z.string().min(1),
  }),
});

export const participantReportSchema = z.object({
  schema_version: z.number().int().positive(),
  metadata: participantReportMetadataSchema,
  clinic: z.record(z.unknown()),
  event: z.record(z.unknown()),
  participant: z.record(z.unknown()),
  summary: z.object({
    lines: z.array(z.string()),
  }),
  measurements: z.record(z.unknown()),
  findings: z.record(z.unknown()),
  recommendations: z.record(z.unknown()),
  education: z.array(z.record(z.unknown())),
  footer: z.record(z.unknown()),
  branding: z.record(z.unknown()),
  qr: z.record(z.unknown()),
  layout: z.record(z.unknown()),
});

export const completionSignatureSchema = z.object({
  image_base64: z.string().min(1),
  mime_type: z.literal('image/png'),
  signed_at: z.string().min(1),
  participant_name: z.string().min(1),
});

export const completionPdfSchema = z.object({
  filename: z.string().min(1),
  mime_type: z.literal('application/pdf'),
  base64: z.string().min(1),
  generated_at: z.string().min(1),
  byte_length: z.number().int().positive(),
  generator_version: z.number().int().positive(),
});

export const completeScreeningSchema = z
  .object({
    anamnesis: screeningAnamnesisSchema,
    clinical_evaluation: clinicalEvaluationResultSchema,
    participant_report: participantReportSchema,
    signature: completionSignatureSchema,
    pdf: completionPdfSchema,
  })
  .superRefine((data, ctx) => {
    if (data.clinical_evaluation.screening_id !== data.participant_report.metadata.report_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'report_id must match clinical_evaluation.screening_id.',
        path: ['participant_report', 'metadata', 'report_id'],
      });
    }
  });

export type CompleteScreeningInput = z.infer<typeof completeScreeningSchema>;
