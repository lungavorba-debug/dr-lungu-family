import type { Request } from 'express';
import type { AuthUser, RecordAuditEventInput } from '@medscreen/types';
import type { RecordAuditEventUseCase } from '../../application/audit/audit.use-cases';

export interface RequestAuditContext {
  ip_address: string | null;
  user_agent: string | null;
}

export function getRequestAuditContext(req: Request): RequestAuditContext {
  const forwarded = req.headers['x-forwarded-for'];
  let ipAddress: string | null = null;

  if (typeof forwarded === 'string' && forwarded.length > 0) {
    ipAddress = forwarded.split(',')[0]?.trim() ?? null;
  } else if (typeof req.ip === 'string' && req.ip.length > 0) {
    ipAddress = req.ip;
  } else if (typeof req.socket.remoteAddress === 'string') {
    ipAddress = req.socket.remoteAddress;
  }

  const userAgent =
    typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;

  return {
    ip_address: ipAddress,
    user_agent: userAgent,
  };
}

export function actorFromAuthUser(user: AuthUser): Pick<
  RecordAuditEventInput,
  'user_id' | 'user_name' | 'role'
> {
  return {
    user_id: user.id,
    user_name: `${user.firstName} ${user.lastName}`,
    role: user.role,
  };
}

export class AuditRecorder {
  constructor(private readonly recordAuditEventUseCase: RecordAuditEventUseCase) {}

  record(input: RecordAuditEventInput): void {
    void this.recordAuditEventUseCase.execute(input).catch((error: unknown) => {
      console.error('Failed to record audit event', error);
    });
  }

  recordFromRequest(
    req: Request,
    user: AuthUser,
    event: Omit<RecordAuditEventInput, 'user_id' | 'user_name' | 'role' | 'ip_address' | 'user_agent'>,
  ): void {
    this.record({
      ...actorFromAuthUser(user),
      ...getRequestAuditContext(req),
      ...event,
    });
  }
}
