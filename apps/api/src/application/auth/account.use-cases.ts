import { createHash, randomBytes } from 'node:crypto';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginResponseData,
  ResetPasswordWithTokenRequest,
  RoleName,
} from '@medscreen/types';
import { toAuthUser } from '../../domain/mappers/user.mapper';
import { PASSWORD_RESET_TOKEN_TTL_MS } from '../../domain/constants/auth-security';
import { AppError } from '../../lib/app-error';
import type { PasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { jwtService } from '../../infrastructure/auth/jwt.service';
import { passwordService } from '../../infrastructure/auth/password.service';
import type { SmtpEmailDeliveryService } from '../../infrastructure/delivery/smtp-email-delivery.service';

function hashResetToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class ChangePasswordUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string, payload: ChangePasswordRequest): Promise<LoginResponseData> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'Utilizatorul nu a fost găsit.');
    }

    const currentValid = await passwordService.compare(payload.current_password, user.passwordHash);
    if (!currentValid) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Parola curentă este incorectă.', [
        { field: 'current_password', issue: 'Parola curentă nu corespunde.' },
      ]);
    }

    if (payload.current_password === payload.new_password) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Parola nouă trebuie să fie diferită de cea curentă.', [
        { field: 'new_password', issue: 'Alegeți o parolă diferită.' },
      ]);
    }

    const passwordHash = await passwordService.hash(payload.new_password);
    const updated = await this.userRepository.updatePasswordWithSessionReset(userId, passwordHash, {
      mustChangePassword: false,
    });

    const authUser = toAuthUser(updated);
    const token = jwtService.sign(authUser, updated.tokenVersion);

    return {
      token,
      role: authUser.role,
      full_name: `${authUser.firstName} ${authUser.lastName}`,
      must_change_password: false,
      user: authUser,
    };
  }
}

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly smtpEmailDeliveryService: SmtpEmailDeliveryService,
  ) {}

  async execute(payload: ForgotPasswordRequest): Promise<{ success: true; email_sent: boolean }> {
    const user = await this.userRepository.findByEmail(payload.email);

    if (!user || !user.active) {
      return { success: true, email_sent: false };
    }

    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);

    await this.passwordResetTokenRepository.invalidateAllForUser(user.id);
    await this.passwordResetTokenRepository.create(user.id, tokenHash, expiresAt);

    const emailConfigured = await this.smtpEmailDeliveryService.isConfigured();
    if (!emailConfigured) {
      return { success: true, email_sent: false };
    }

    const webAppUrl = process.env.WEB_APP_URL?.trim();
    if (!webAppUrl) {
      console.error('[auth] WEB_APP_URL is not configured; password reset email cannot be sent.');
      return { success: true, email_sent: false };
    }

    const resetUrl = `${webAppUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`;

    try {
      await this.smtpEmailDeliveryService.sendPlainEmail({
        to: user.email,
        subject: 'Resetare parolă MedScreen',
        text: `Ați solicitat resetarea parolei.\n\nAccesați linkul: ${resetUrl}\n\nLinkul expiră în 1 oră.`,
      });
      return { success: true, email_sent: true };
    } catch {
      return { success: true, email_sent: false };
    }
  }
}

export class ResetPasswordWithTokenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
  ) {}

  async execute(payload: ResetPasswordWithTokenRequest): Promise<{
    success: true;
    user: { id: string; firstName: string; lastName: string; role: RoleName };
  }> {
    const tokenHash = hashResetToken(payload.token);
    const resetToken = await this.passwordResetTokenRepository.findValidByTokenHash(tokenHash);

    if (!resetToken) {
      throw new AppError(400, 'INVALID_TOKEN', 'Linkul de resetare este invalid sau a expirat.');
    }

    const user = await this.userRepository.findById(resetToken.userId);
    if (!user || !user.active) {
      throw new AppError(400, 'INVALID_TOKEN', 'Linkul de resetare este invalid sau a expirat.');
    }

    const passwordHash = await passwordService.hash(payload.password);
    await this.userRepository.updatePasswordWithSessionReset(user.id, passwordHash, {
      mustChangePassword: false,
    });
    await this.passwordResetTokenRepository.markUsed(resetToken.id, new Date());

    return {
      success: true as const,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.roleName,
      },
    };
  }
}

export class InvalidateSessionUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<void> {
    await this.userRepository.incrementTokenVersion(userId);
  }
}
