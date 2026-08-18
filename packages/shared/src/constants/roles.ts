import { ROLES, type RoleName } from '@medscreen/types';

const ROLE_SET = new Set<string>(Object.values(ROLES));

export function isRoleName(value: string): value is RoleName {
  return ROLE_SET.has(value);
}
