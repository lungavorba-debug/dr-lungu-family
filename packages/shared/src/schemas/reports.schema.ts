import { z } from 'zod';

export const listScreeningReportsQuerySchema = z.object({
  campaign_id: z.string().uuid('ID campanie invalid.'),
  patient_id: z.string().uuid('ID pacient invalid.').optional(),
  search: z.string().trim().min(1).max(100).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListScreeningReportsQuery = z.infer<typeof listScreeningReportsQuerySchema>;
