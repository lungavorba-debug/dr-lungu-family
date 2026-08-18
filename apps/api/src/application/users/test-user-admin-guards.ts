/**
 * User administration guard and setup tests.
 * Run: npm run test:user-admin
 */
import { ROLES, type RoleName } from '@medscreen/types';
import {
  CreateInitialAdminUseCase,
  GetSetupStatusUseCase,
} from '../setup/setup.use-cases';
import {
  DeleteUserUseCase,
  SetUserActiveUseCase,
  UpdateUserUseCase,
} from './user-admin.use-cases';
import { AppError } from '../../lib/app-error';
import type {
  CreateUserData,
  ListUsersParams,
  UpdateUserData,
  UserCampaignRecord,
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function assertThrowsCode(
  name: string,
  run: () => Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  return run()
    .then(() => {
      assert(name, false, `expected ${expectedCode}`);
    })
    .catch((error: unknown) => {
      if (error instanceof AppError) {
        assert(name, error.errorCode === expectedCode, error.errorCode);
        return;
      }
      assert(name, false, error instanceof Error ? error.message : 'unknown error');
    });
}

function defaultProfileFields() {
  return {
    failedLoginAttempts: 0,
    lockedUntil: null as Date | null,
    mustChangePassword: false,
    passwordChangedAt: null as Date | null,
    tokenVersion: 0,
    medicalSpecialty: null as string | null,
    professionalTitle: null as string | null,
    licenseNumber: null as string | null,
    phone: null as string | null,
    avatarImageBase64: null as string | null,
    avatarMimeType: null as string | null,
    signatureImageBase64: null as string | null,
    signatureMimeType: null as string | null,
  };
}

class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, UserRecord>();
  private roleIds: Record<RoleName, string> = {
    ADMIN: 'role-admin',
    MEDIC: 'role-medic',
    OPERATOR: 'role-operator',
  };

  seed(user: UserRecord): void {
    this.users.set(user.id, { ...user });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) {
        return { ...user };
      }
    }
    return null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findRoleIdByName(roleName: RoleName): Promise<string | null> {
    return this.roleIds[roleName] ?? null;
  }

  async create(data: CreateUserData): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user-${this.users.size + 1}`,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      roleId: data.roleId,
      active: data.active ?? true,
      roleName: Object.entries(this.roleIds).find(([, id]) => id === data.roleId)?.[0] as RoleName,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      lastLoginAt: null,
      ...defaultProfileFields(),
      mustChangePassword: data.mustChangePassword ?? false,
    };
    this.users.set(user.id, user);
    return { ...user };
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) {
      throw new Error('User not found');
    }

    const updated: UserRecord = {
      ...current,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      email: data.email?.toLowerCase() ?? current.email,
      active: data.active ?? current.active,
      roleId: data.roleId ?? current.roleId,
      roleName:
        data.roleId !== undefined
          ? (Object.entries(this.roleIds).find(([, roleId]) => roleId === data.roleId)?.[0] as RoleName)
          : current.roleName,
    };

    this.users.set(id, updated);
    return { ...updated };
  }

  async updatePassword(): Promise<void> {
    return;
  }

  async updateProfile(id: string, data: import('../../domain/repositories/user.repository').UpdateUserProfileData): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) throw new Error('User not found');
    const updated = {
      ...current,
      firstName: data.firstName ?? current.firstName,
      lastName: data.lastName ?? current.lastName,
      medicalSpecialty: data.medicalSpecialty ?? current.medicalSpecialty,
      professionalTitle: data.professionalTitle ?? current.professionalTitle,
      licenseNumber: data.licenseNumber ?? current.licenseNumber,
      phone: data.phone ?? current.phone,
      avatarImageBase64: data.avatarImageBase64 ?? current.avatarImageBase64,
      avatarMimeType: data.avatarMimeType ?? current.avatarMimeType,
      signatureImageBase64: data.signatureImageBase64 ?? current.signatureImageBase64,
      signatureMimeType: data.signatureMimeType ?? current.signatureMimeType,
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async updatePasswordWithSessionReset(id: string, passwordHash: string, options?: { mustChangePassword?: boolean }): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) throw new Error('User not found');
    const updated = {
      ...current,
      passwordHash,
      mustChangePassword: options?.mustChangePassword ?? false,
      tokenVersion: current.tokenVersion + 1,
      failedLoginAttempts: 0,
      lockedUntil: null,
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async recordFailedLogin(id: string, attempts: number, lockedUntil: Date | null): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.failedLoginAttempts = attempts;
      user.lockedUntil = lockedUntil;
    }
  }

  async resetFailedLoginAttempts(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.failedLoginAttempts = 0;
      user.lockedUntil = null;
    }
  }

  async unlockAccount(id: string): Promise<UserRecord> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    return { ...user };
  }

  async incrementTokenVersion(id: string): Promise<UserRecord> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    user.tokenVersion += 1;
    return { ...user };
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = at;
    }
  }

  async list(_params: ListUsersParams): Promise<{ items: UserRecord[]; total: number }> {
    const items = [...this.users.values()];
    return { items, total: items.length };
  }

  async getCampaignsForUser(_userId: string): Promise<UserCampaignRecord[]> {
    return [];
  }

  async countActiveByRole(roleName: RoleName): Promise<number> {
    return [...this.users.values()].filter((user) => user.active && user.roleName === roleName).length;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

function buildAdmin(id: string, active = true): UserRecord {
  return {
    id,
    firstName: 'Admin',
    lastName: id,
    email: `${id}@example.com`,
    passwordHash: 'hash',
    roleId: 'role-admin',
    active,
    roleName: ROLES.ADMIN,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    lastLoginAt: null,
    ...defaultProfileFields(),
  };
}

async function runTests(): Promise<void> {
  {
    const repository = new InMemoryUserRepository();
    const useCase = new GetSetupStatusUseCase(repository);
    const emptyStatus = await useCase.execute();
    assert('setup status required when no active admin', emptyStatus.setup_required === true);

    repository.seed(buildAdmin('admin-1'));
    const completedStatus = await useCase.execute();
    assert('setup status not required when active admin exists', completedStatus.setup_required === false);
  }

  {
    process.env.JWT_SECRET ??= 'test-user-admin-secret-with-32-chars-min';
    process.env.JWT_EXPIRES_IN ??= '1h';

    const repository = new InMemoryUserRepository();
    const useCase = new CreateInitialAdminUseCase(repository);

    const result = await useCase.execute({
      first_name: 'Ana',
      last_name: 'Admin',
      email: 'ana.admin@example.com',
      password: 'password123',
    });

    assert('initial admin creation returns token', Boolean(result.token));
    assert('initial admin role is ADMIN', result.role === ROLES.ADMIN);

    await assertThrowsCode(
      'initial admin creation allowed only once',
      () =>
        useCase.execute({
          first_name: 'Second',
          last_name: 'Admin',
          email: 'second.admin@example.com',
          password: 'password123',
        }),
      'SETUP_ALREADY_COMPLETED',
    );
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-only'));
    const useCase = new SetUserActiveUseCase(repository);

    await assertThrowsCode(
      'last active admin cannot be deactivated',
      () =>
        useCase.execute({
          userId: 'admin-only',
          active: false,
          actorId: 'other-user',
        }),
      'LAST_ADMIN_PROTECTED',
    );
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-1'));
    repository.seed(buildAdmin('admin-2'));
    const useCase = new SetUserActiveUseCase(repository);

    const result = await useCase.execute({
      userId: 'admin-1',
      active: false,
      actorId: 'admin-2',
    });
    assert('non-last active admin can be deactivated', result.user.active === false);
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-only'));
    const useCase = new UpdateUserUseCase(repository);

    await assertThrowsCode(
      'last active admin cannot be demoted',
      () =>
        useCase.execute('admin-only', {
          role: ROLES.MEDIC,
        }),
      'LAST_ADMIN_PROTECTED',
    );
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-1'));
    repository.seed(buildAdmin('admin-2'));
    const useCase = new UpdateUserUseCase(repository);

    const result = await useCase.execute('admin-1', {
      role: ROLES.OPERATOR,
    });
    assert('non-last active admin can be demoted', result.user.role === ROLES.OPERATOR);
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-only'));
    const useCase = new DeleteUserUseCase(repository);

    await assertThrowsCode(
      'last active admin cannot be deleted',
      () =>
        useCase.execute({
          userId: 'admin-only',
          actorId: 'other-user',
        }),
      'LAST_ADMIN_PROTECTED',
    );
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-1'));
    repository.seed(buildAdmin('admin-2'));
    const useCase = new DeleteUserUseCase(repository);

    const result = await useCase.execute({
      userId: 'admin-1',
      actorId: 'admin-2',
    });
    assert('non-last active admin can be deleted', result.success === true);
    const deleted = await repository.findById('admin-1');
    assert('deleted admin no longer exists', deleted === null);
  }

  {
    const repository = new InMemoryUserRepository();
    repository.seed(buildAdmin('admin-inactive', false));
    const useCase = new DeleteUserUseCase(repository);

    const result = await useCase.execute({
      userId: 'admin-inactive',
      actorId: 'other-user',
    });
    assert('inactive admin can be deleted even if sole admin record', result.success === true);
  }

  console.log('\nUser administration guard tests complete.');
}

void runTests();
