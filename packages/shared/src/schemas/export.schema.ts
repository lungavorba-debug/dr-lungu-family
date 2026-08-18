import { z } from 'zod';

export const exportScreeningsQuerySchema = z.object({
  campaign_id: z.string().uuid('ID campanie invalid.'),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  campaign_day: z.coerce.number().int().min(1).max(31).optional(),
});

export type ExportScreeningsQuery = z.infer<typeof exportScreeningsQuerySchema>;
