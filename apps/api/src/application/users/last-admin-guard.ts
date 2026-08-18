import { ROLES, type RoleName } from '@medscreen/types';
import type { UserRecord, UserRepository } from '../../domain/repositories/user.repository';
import { AppError } from '../../lib/app-error';

export type LastAdminGuardAction = 'deactivate' | 'demote' | 'delete';

const GUARD_MESSAGES: Record<LastAdminGuardAction, string> = {
  deactivate: 'Nu puteți dezactiva ultimul administrator activ.',
  demote: 'Nu puteți schimba rolul ultimului administrator activ.',
  delete: 'Nu puteți șterge ultimul administrator activ.',
};

export async function assertNotLastActiveAdmin(
  userRepository: UserRepository,
  user: UserRecord,
  action: LastAdminGuardAction,
): Promise<void> {
  if (user.roleName !== ROLES.ADMIN || !user.active) {
    return;
  }

  const activeAdminCount = await userRepository.countActiveByRole(ROLES.ADMIN);
  if (activeAdminCount <= 1) {
    throw new AppError(400, 'LAST_ADMIN_PROTECTED', GUARD_MESSAGES[action]);
  }
}

export async function isSetupRequired(userRepository: UserRepository): Promise<boolean> {
  const activeAdminCount = await userRepository.countActiveByRole(ROLES.ADMIN);
  return activeAdminCount === 0;
}

export function isAdminRoleDemotion(currentRole: RoleName, nextRole: RoleName | undefined): boolean {
  return currentRole === ROLES.ADMIN && nextRole !== undefined && nextRole !== ROLES.ADMIN;
}
