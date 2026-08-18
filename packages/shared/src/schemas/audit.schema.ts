import { z } from 'zod';
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';

const auditActionValues = Object.values(AUDIT_ACTIONS) as [
  (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS],
  ...(typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS][],
];

const auditEntityTypeValues = Object.values(AUDIT_ENTITY_TYPES) as [
  (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES],
  ...(typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES][],
];

const auditActionSchema = z.enum(auditActionValues);
const auditEntityTypeSchema = z.enum(auditEntityTypeValues);

export const listAuditLogsQuerySchema = z.object({
  search: z.string().trim().min(1).max(100).optional(),
  action: auditActionSchema.optional(),
  entity_type: auditEntityTypeSchema.optional(),
  entity_id: z.string().trim().min(1).max(100).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAuditLogsQueryInput = z.infer<typeof listAuditLogsQuerySchema>;
