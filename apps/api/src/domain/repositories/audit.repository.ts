import type { AuditAction, AuditEntityType, RoleName } from '@medscreen/types';

export interface AuditLogRecord {
  id: string;
  occurredAt: Date;
  userId: string;
  userName: string;
  role: RoleName;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface CreateAuditLogData {
  userId: string;
  userName: string;
  role: RoleName;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface ListAuditLogsParams {
  search?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  from?: Date;
  to?: Date;
  skip: number;
  take: number;
}

export interface AuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogRecord>;
  list(params: ListAuditLogsParams): Promise<{ items: AuditLogRecord[]; total: number }>;
}
