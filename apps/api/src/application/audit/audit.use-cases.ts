import type { AuditLogListItem, ListAuditLogsResponse, RecordAuditEventInput } from '@medscreen/types';
import type { AuditLogRecord, AuditLogRepository } from '../../domain/repositories/audit.repository';

function toListItem(record: AuditLogRecord): AuditLogListItem {
  return {
    id: record.id,
    occurred_at: record.occurredAt.toISOString(),
    user_id: record.userId,
    user_name: record.userName,
    role: record.role,
    action: record.action,
    entity_type: record.entityType,
    entity_id: record.entityId,
    description: record.description,
    ip_address: record.ipAddress,
    user_agent: record.userAgent,
  };
}

export class RecordAuditEventUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(input: RecordAuditEventInput): Promise<AuditLogListItem> {
    const record = await this.auditLogRepository.create({
      userId: input.user_id,
      userName: input.user_name,
      role: input.role,
      action: input.action,
      entityType: input.entity_type,
      entityId: input.entity_id ?? null,
      description: input.description,
      ipAddress: input.ip_address ?? null,
      userAgent: input.user_agent ?? null,
    });

    return toListItem(record);
  }
}

export class ListAuditLogsUseCase {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  async execute(params: {
    search?: string;
    action?: AuditLogListItem['action'];
    entityType?: AuditLogListItem['entity_type'];
    entityId?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }): Promise<ListAuditLogsResponse> {
    const skip = (params.page - 1) * params.limit;
    const result = await this.auditLogRepository.list({
      search: params.search,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      skip,
      take: params.limit,
    });

    return {
      entries: result.items.map(toListItem),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}
