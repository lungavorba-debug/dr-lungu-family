import type { LoginInput } from '@medscreen/shared';
import type { LoginResponseData } from '@medscreen/types';
import { toAuthUser } from '../../domain/mappers/user.mapper';
import {
  ACCOUNT_LOCKOUT_MS,
  MAX_FAILED_LOGIN_ATTEMPTS,
} from '../../domain/constants/auth-security';
import { AppError } from '../../lib/app-error';
import type { UserRecord, UserRepository } from '../../domain/repositories/user.repository';
import { jwtService } from '../../infrastructure/auth/jwt.service';
import { passwordService } from '../../infrastructure/auth/password.service';

export interface LoginAuditRecorder {
  recordFailedLogin(params: {
    email: string;
    user: UserRecord | null;
    reason: string;
  }): void;
  recordAccountLocked(user: UserRecord): void;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditRecorder?: LoginAuditRecorder,
  ) {}

  async execute(input: LoginInput): Promise<LoginResponseData> {
    const user = await this.userRepository.findByEmail(input.email);

    if (user?.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
      throw new AppError(
        423,
        'ACCOUNT_LOCKED',
        `Contul este blocat temporar. Încercați din nou după ${user.lockedUntil.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}.`,
      );
    }

    if (user?.lockedUntil && user.lockedUntil.getTime() <= Date.now()) {
      await this.userRepository.resetFailedLoginAttempts(user.id);
    }

    const passwordHash = user?.passwordHash ?? passwordService.getDummyHash();
    const passwordValid = await passwordService.compare(input.password, passwordHash);

    if (!user || !passwordValid) {
      if (user) {
        const nextAttempts = user.failedLoginAttempts + 1;
        const shouldLock = nextAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
        const lockedUntil = shouldLock ? new Date(Date.now() + ACCOUNT_LOCKOUT_MS) : null;

        await this.userRepository.recordFailedLogin(user.id, nextAttempts, lockedUntil);

        this.auditRecorder?.recordFailedLogin({
          email: input.email,
          user,
          reason: shouldLock ? 'account_locked' : 'invalid_password',
        });

        if (shouldLock) {
          const lockedUser = { ...user, lockedUntil };
          this.auditRecorder?.recordAccountLocked(lockedUser);
          throw new AppError(
            423,
            'ACCOUNT_LOCKED',
            'Contul a fost blocat temporar din cauza prea multor încercări eșuate. Încercați din nou peste 15 minute.',
          );
        }
      }

      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'Nume de utilizator sau parolă incorecte.',
      );
    }

    if (!user.active) {
      throw new AppError(
        403,
        'ACCOUNT_INACTIVE',
        'Contul este dezactivat. Contactați administratorul.',
      );
    }

    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.userRepository.resetFailedLoginAttempts(user.id);
    }

    const authUser = toAuthUser(user);
    const token = jwtService.sign(authUser, user.tokenVersion);

    await this.userRepository.updateLastLogin(user.id, new Date());

    return {
      token,
      role: authUser.role,
      full_name: `${authUser.firstName} ${authUser.lastName}`,
      must_change_password: authUser.must_change_password,
      user: authUser,
    };
  }
}
