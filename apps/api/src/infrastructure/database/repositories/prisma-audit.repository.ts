import type { AuditAction, AuditEntityType } from '@medscreen/types';
import { isRoleName } from '@medscreen/shared';
import type {
  AuditLogRecord,
  AuditLogRepository,
  CreateAuditLogData,
  ListAuditLogsParams,
} from '../../../domain/repositories/audit.repository';
import { prisma } from '../prisma.client';

function mapRecord(record: {
  id: string;
  occurredAt: Date;
  userId: string;
  userName: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
}): AuditLogRecord {
  if (!isRoleName(record.role)) {
    throw new Error(`Invalid role in audit log: ${record.id}`);
  }

  return {
    id: record.id,
    occurredAt: record.occurredAt,
    userId: record.userId,
    userName: record.userName,
    role: record.role,
    action: record.action as AuditAction,
    entityType: record.entityType as AuditEntityType,
    entityId: record.entityId,
    description: record.description,
    ipAddress: record.ipAddress,
    userAgent: record.userAgent,
  };
}

export class PrismaAuditLogRepository implements AuditLogRepository {
  async create(data: CreateAuditLogData): Promise<AuditLogRecord> {
    const record = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        userName: data.userName,
        role: data.role,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        description: data.description,
        ipAddress: data.ipAddress ?? null,
        userAgent: data.userAgent ?? null,
      },
    });

    return mapRecord(record);
  }

  async list(params: ListAuditLogsParams): Promise<{ items: AuditLogRecord[]; total: number }> {
    const where = {
      ...(params.action ? { action: params.action } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
      ...(params.entityId ? { entityId: params.entityId } : {}),
      ...(params.from || params.to
        ? {
            occurredAt: {
              ...(params.from ? { gte: params.from } : {}),
              ...(params.to ? { lte: params.to } : {}),
            },
          }
        : {}),
      ...(params.search
        ? {
            OR: [
              { userName: { contains: params.search, mode: 'insensitive' as const } },
              { description: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows.map(mapRecord),
      total,
    };
  }
}
