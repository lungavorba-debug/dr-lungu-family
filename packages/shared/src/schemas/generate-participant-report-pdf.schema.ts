import { z } from 'zod';
import { participantReportSchema } from './screening-completion.schema';

export const generateParticipantReportPdfSchema = z.object({
  participant_report: participantReportSchema,
  participant_signature_data_url: z.string().nullable().optional(),
});

export type GenerateParticipantReportPdfInput = z.infer<typeof generateParticipantReportPdfSchema>;
