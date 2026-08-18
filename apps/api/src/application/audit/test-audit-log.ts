/**
 * Audit log persistence and listing tests.
 * Run: npm run test:audit
 */
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, ROLES } from '@medscreen/types';
import {
  ListAuditLogsUseCase,
  RecordAuditEventUseCase,
} from './audit.use-cases';
import type {
  AuditLogRecord,
  AuditLogRepository,
  CreateAuditLogData,
  ListAuditLogsParams,
} from '../../domain/repositories/audit.repository';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

class InMemoryAuditLogRepository implements AuditLogRepository {
  private entries: AuditLogRecord[] = [];

  async create(data: CreateAuditLogData): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: `audit-${this.entries.length + 1}`,
      occurredAt: new Date(),
      userId: data.userId,
      userName: data.userName,
      role: data.role,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      description: data.description,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    };
    this.entries.unshift(record);
    return record;
  }

  async list(params: ListAuditLogsParams): Promise<{ items: AuditLogRecord[]; total: number }> {
    let items = [...this.entries];

    if (params.search) {
      const term = params.search.toLowerCase();
      items = items.filter(
        (entry) =>
          entry.userName.toLowerCase().includes(term) ||
          entry.description.toLowerCase().includes(term),
      );
    }

    if (params.action) {
      items = items.filter((entry) => entry.action === params.action);
    }

    if (params.entityType) {
      items = items.filter((entry) => entry.entityType === params.entityType);
    }

    if (params.entityId) {
      items = items.filter((entry) => entry.entityId === params.entityId);
    }

    if (params.from) {
      items = items.filter((entry) => entry.occurredAt >= params.from!);
    }

    if (params.to) {
      items = items.filter((entry) => entry.occurredAt <= params.to!);
    }

    const total = items.length;
    return {
      items: items.slice(params.skip, params.skip + params.take),
      total,
    };
  }
}

async function runTests(): Promise<void> {
  const repository = new InMemoryAuditLogRepository();
  const recordUseCase = new RecordAuditEventUseCase(repository);
  const listUseCase = new ListAuditLogsUseCase(repository);

  await recordUseCase.execute({
    user_id: 'user-1',
    user_name: 'Ana Admin',
    role: ROLES.ADMIN,
    action: AUDIT_ACTIONS.LOGIN,
    entity_type: AUDIT_ENTITY_TYPES.SESSION,
    entity_id: 'user-1',
    description: 'Autentificare reușită.',
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
  });

  await recordUseCase.execute({
    user_id: 'user-2',
    user_name: 'Ion Operator',
    role: ROLES.OPERATOR,
    action: AUDIT_ACTIONS.SCREENING_STARTED,
    entity_type: AUDIT_ENTITY_TYPES.SCREENING,
    entity_id: 'screening-1',
    description: 'Screening nou inițiat.',
  });

  const all = await listUseCase.execute({ page: 1, limit: 20 });
  assert('records audit events', all.total === 2);

  const byUser = await listUseCase.execute({ search: 'Ana', page: 1, limit: 20 });
  assert('filters by user name', byUser.total === 1 && byUser.entries[0]?.user_name === 'Ana Admin');

  const byAction = await listUseCase.execute({
    action: AUDIT_ACTIONS.SCREENING_STARTED,
    page: 1,
    limit: 20,
  });
  assert('filters by action', byAction.total === 1 && byAction.entries[0]?.action === AUDIT_ACTIONS.SCREENING_STARTED);

  const byEntity = await listUseCase.execute({
    entityType: AUDIT_ENTITY_TYPES.SCREENING,
    entityId: 'screening-1',
    page: 1,
    limit: 20,
  });
  assert('filters by entity', byEntity.total === 1 && byEntity.entries[0]?.entity_id === 'screening-1');

  const paginated = await listUseCase.execute({ page: 1, limit: 1 });
  assert('paginates results', paginated.entries.length === 1 && paginated.total === 2);

  const loginEntry = (await listUseCase.execute({ action: AUDIT_ACTIONS.LOGIN, page: 1, limit: 1 }))
    .entries[0];
  assert('stores ip address', loginEntry?.ip_address === '127.0.0.1');
  assert('stores user agent', loginEntry?.user_agent === 'test-agent');
  assert('stores description', loginEntry?.description === 'Autentificare reușită.');

  console.log('\nAudit log tests complete.');
}

void runTests();
