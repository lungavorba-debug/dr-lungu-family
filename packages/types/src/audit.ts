import type { RoleName } from './auth';

export const AUDIT_ACTIONS = {
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  INITIAL_SETUP: 'initial_setup',
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  USER_ACTIVATED: 'user_activated',
  USER_DEACTIVATED: 'user_deactivated',
  USER_DELETED: 'user_deleted',
  CAMPAIGN_CREATED: 'campaign_created',
  CAMPAIGN_UPDATED: 'campaign_updated',
  CAMPAIGN_ACTIVATED: 'campaign_activated',
  CAMPAIGN_CLOSED: 'campaign_closed',
  CAMPAIGN_ARCHIVED: 'campaign_archived',
  CAMPAIGN_DELETED: 'campaign_deleted',
  SCREENING_STARTED: 'screening_started',
  SCREENING_COMPLETED: 'screening_completed',
  REPORT_GENERATED: 'report_generated',
  REPORT_DOWNLOADED: 'report_downloaded',
  REPORT_DELIVERED: 'report_delivered',
  EXPORT_GENERATED: 'export_generated',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ENTITY_TYPES = {
  USER: 'user',
  CAMPAIGN: 'campaign',
  SCREENING: 'screening',
  REPORT: 'report',
  EXPORT: 'export',
  SESSION: 'session',
} as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[keyof typeof AUDIT_ENTITY_TYPES];

export interface AuditLogListItem {
  id: string;
  occurred_at: string;
  user_id: string;
  user_name: string;
  role: RoleName;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id: string | null;
  description: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface ListAuditLogsResponse {
  entries: AuditLogListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface RecordAuditEventInput {
  user_id: string;
  user_name: string;
  role: RoleName;
  action: AuditAction;
  entity_type: AuditEntityType;
  entity_id?: string | null;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
}
