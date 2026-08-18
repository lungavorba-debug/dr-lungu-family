/**
 * Auth security tests.
 * Run: npm run test:auth-security
 */
import { ROLES } from '@medscreen/types';
import { LoginUseCase } from './login.use-case';
import {
  ChangePasswordUseCase,
  ResetPasswordWithTokenUseCase,
} from './account.use-cases';
import { AppError } from '../../lib/app-error';
import type {
  CreateUserData,
  ListUsersParams,
  UpdateUserData,
  UpdateUserProfileData,
  UserCampaignRecord,
  UserRecord,
  UserRepository,
} from '../../domain/repositories/user.repository';
import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../domain/repositories/password-reset-token.repository';
import { passwordService } from '../../infrastructure/auth/password.service';
import { jwtService } from '../../infrastructure/auth/jwt.service';
import { MAX_FAILED_LOGIN_ATTEMPTS } from '../../domain/constants/auth-security';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

class MemoryUserRepository implements UserRepository {
  private users = new Map<string, UserRecord>();

  seed(user: UserRecord): void {
    this.users.set(user.id, { ...user });
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.users.values()) {
      if (user.email === email.toLowerCase()) return { ...user };
    }
    return null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  async findRoleIdByName(): Promise<string | null> {
    return 'role-admin';
  }

  async create(_data: CreateUserData): Promise<UserRecord> {
    throw new Error('not implemented');
  }

  async update(id: string, data: UpdateUserData): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) throw new Error('missing');
    const updated = { ...current, ...data, email: data.email?.toLowerCase() ?? current.email };
    this.users.set(id, updated);
    return { ...updated };
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<UserRecord> {
    const current = this.users.get(id);
    if (!current) throw new Error('missing');
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

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (user) user.passwordHash = passwordHash;
  }

  async updatePasswordWithSessionReset(
    id: string,
    passwordHash: string,
    options?: { mustChangePassword?: boolean },
  ): Promise<UserRecord> {
    const user = this.users.get(id);
    if (!user) throw new Error('missing');
    user.passwordHash = passwordHash;
    user.mustChangePassword = options?.mustChangePassword ?? false;
    user.tokenVersion += 1;
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    return { ...user };
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    const user = this.users.get(id);
    if (user) user.lastLoginAt = at;
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
    if (!user) throw new Error('missing');
    user.failedLoginAttempts = 0;
    user.lockedUntil = null;
    return { ...user };
  }

  async incrementTokenVersion(id: string): Promise<UserRecord> {
    const user = this.users.get(id);
    if (!user) throw new Error('missing');
    user.tokenVersion += 1;
    return { ...user };
  }

  async list(_params: ListUsersParams) {
    return { items: [...this.users.values()], total: this.users.size };
  }

  async getCampaignsForUser(_userId: string): Promise<UserCampaignRecord[]> {
    return [];
  }

  async countActiveByRole(): Promise<number> {
    return 1;
  }

  async delete(): Promise<void> {
    return;
  }
}

class MemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private tokens = new Map<string, PasswordResetTokenRecord>();

  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetTokenRecord> {
    const token: PasswordResetTokenRecord = {
      id: `token-${this.tokens.size + 1}`,
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.tokens.set(token.id, token);
    return token;
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash === tokenHash && !token.usedAt && token.expiresAt.getTime() > Date.now()) {
        return { ...token };
      }
    }
    return null;
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    const token = this.tokens.get(id);
    if (token) token.usedAt = usedAt;
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    for (const token of this.tokens.values()) {
      if (token.userId === userId && !token.usedAt) {
        token.usedAt = new Date();
      }
    }
  }
}

async function runTests(): Promise<void> {
  process.env.JWT_SECRET ??= 'test-auth-security-secret-with-32-chars';
  process.env.JWT_EXPIRES_IN ??= '1h';

  const passwordHash = await passwordService.hash('correct-password');
  const repository = new MemoryUserRepository();
  repository.seed({
    id: 'user-1',
    firstName: 'Ana',
    lastName: 'Medic',
    email: 'ana@example.com',
    passwordHash,
    roleId: 'role-medic',
    active: true,
    roleName: ROLES.MEDIC,
    createdAt: new Date(),
    lastLoginAt: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    mustChangePassword: false,
    passwordChangedAt: new Date(),
    tokenVersion: 0,
    medicalSpecialty: null,
    professionalTitle: null,
    licenseNumber: null,
    phone: null,
    avatarImageBase64: null,
    avatarMimeType: null,
    signatureImageBase64: null,
    signatureMimeType: null,
  });

  const loginUseCase = new LoginUseCase(repository);

  try {
    await loginUseCase.execute({ email: 'ana@example.com', password: 'wrong-password' });
    assert('invalid login throws', false);
  } catch (error) {
    assert(
      'invalid login throws INVALID_CREDENTIALS',
      error instanceof AppError && error.errorCode === 'INVALID_CREDENTIALS',
    );
  }

  for (let attempt = 1; attempt < MAX_FAILED_LOGIN_ATTEMPTS; attempt += 1) {
    try {
      await loginUseCase.execute({ email: 'ana@example.com', password: 'wrong-password' });
    } catch {
      // expected
    }
  }

  const beforeLock = await repository.findById('user-1');
  assert(
    'failed attempts increment before lockout',
    beforeLock?.failedLoginAttempts === MAX_FAILED_LOGIN_ATTEMPTS,
  );

  try {
    await loginUseCase.execute({ email: 'ana@example.com', password: 'wrong-password' });
    assert('lockout after max attempts', false);
  } catch (error) {
    assert(
      'lockout after max attempts',
      error instanceof AppError && error.errorCode === 'ACCOUNT_LOCKED',
    );
  }

  await repository.unlockAccount('user-1');

  const loginResult = await loginUseCase.execute({
    email: 'ana@example.com',
    password: 'correct-password',
  });
  assert('successful login returns token', Boolean(loginResult.token));
  assert('successful login clears failed attempts', (await repository.findById('user-1'))?.failedLoginAttempts === 0);

  const payload = jwtService.verify(loginResult.token);
  assert('jwt includes token version', payload.tv === 0);

  const changePasswordUseCase = new ChangePasswordUseCase(repository);
  const changed = await changePasswordUseCase.execute('user-1', {
    current_password: 'correct-password',
    new_password: 'new-password-123',
  });
  assert('change password returns refreshed token', Boolean(changed.token));

  const changedPayload = jwtService.verify(changed.token);
  assert('change password increments token version', changedPayload.tv === 1);
  assert(
    'old token has lower token version than new token',
    payload.tv < changedPayload.tv,
  );

  const tokenRepo = new MemoryPasswordResetTokenRepository();
  const resetUseCase = new ResetPasswordWithTokenUseCase(repository, tokenRepo);
  const rawToken = 'reset-token-raw-value';
  const { createHash } = await import('node:crypto');
  await tokenRepo.create('user-1', createHash('sha256').update(rawToken).digest('hex'), new Date(Date.now() + 60_000));

  await resetUseCase.execute({ token: rawToken, password: 'reset-password-123' });
  const relogin = await loginUseCase.execute({
    email: 'ana@example.com',
    password: 'reset-password-123',
  });
  assert('reset password token allows login with new password', Boolean(relogin.token));

  console.log('\nAuth security tests complete.');
}

void runTests();
