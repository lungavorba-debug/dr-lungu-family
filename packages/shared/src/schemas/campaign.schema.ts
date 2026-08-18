import { z } from 'zod';
import { CAMPAIGN_STATUSES } from '@medscreen/types';

const dateStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data trebuie să fie în format YYYY-MM-DD.');

const campaignFieldsSchema = z.object({
  name: z.string().trim().min(1, 'Numele campaniei este obligatoriu.').max(200),
  description: z.string().trim().max(2000).nullable().optional(),
  start_date: dateStringSchema,
  end_date: dateStringSchema,
  location: z.string().trim().min(1, 'Locația este obligatorie.').max(200),
  organizer: z.string().trim().max(200).nullable().optional(),
  screening_type: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(5000).nullable().optional(),
  edition: z.string().trim().max(120).nullable().optional(),
});

function validateDateRange(data: { start_date: string; end_date: string }, ctx: z.RefinementCtx) {
  if (data.end_date < data.start_date) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Data de încheiere trebuie să fie după data de început.',
      path: ['end_date'],
    });
  }
}

export const createCampaignSchema = campaignFieldsSchema.superRefine(validateDateRange);

export const updateCampaignSchema = campaignFieldsSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Trebuie furnizat cel puțin un câmp de actualizat.',
  })
  .superRefine((data, ctx) => {
    if (data.start_date && data.end_date) {
      validateDateRange(
        { start_date: data.start_date, end_date: data.end_date },
        ctx,
      );
    }
  });

export const listCampaignsAdminQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  status: z.enum([
    CAMPAIGN_STATUSES.UPCOMING,
    CAMPAIGN_STATUSES.ACTIVE,
    CAMPAIGN_STATUSES.CLOSED,
    CAMPAIGN_STATUSES.ARCHIVED,
  ]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
