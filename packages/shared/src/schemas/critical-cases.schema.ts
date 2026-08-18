import { z } from 'zod';

export const listCriticalCasesQuerySchema = z.object({
  campaign_id: z.string().uuid('ID campanie invalid.'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListCriticalCasesQuery = z.infer<typeof listCriticalCasesQuerySchema>;
