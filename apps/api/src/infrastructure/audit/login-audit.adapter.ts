import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from '@medscreen/types';
import type { LoginAuditRecorder } from '../../application/auth/login.use-case';
import type { UserRecord } from '../../domain/repositories/user.repository';
import type { AuditRecorder } from './audit-recorder';

export class LoginAuditAdapter implements LoginAuditRecorder {
  constructor(private readonly auditRecorder: AuditRecorder) {}

  recordFailedLogin(params: { email: string; user: UserRecord | null; reason: string }): void {
    if (!params.user) {
      return;
    }

    this.auditRecorder.record({
      user_id: params.user.id,
      user_name: `${params.user.firstName} ${params.user.lastName}`,
      role: params.user.roleName,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      entity_type: AUDIT_ENTITY_TYPES.SESSION,
      entity_id: params.user.id,
      description: `Autentificare eșuată pentru ${params.email}.`,
    });
  }

  recordAccountLocked(user: UserRecord): void {
    this.auditRecorder.record({
      user_id: user.id,
      user_name: `${user.firstName} ${user.lastName}`,
      role: user.roleName,
      action: AUDIT_ACTIONS.ACCOUNT_LOCKED,
      entity_type: AUDIT_ENTITY_TYPES.USER,
      entity_id: user.id,
      description: 'Cont blocat temporar din cauza încercărilor eșuate.',
    });
  }
}
