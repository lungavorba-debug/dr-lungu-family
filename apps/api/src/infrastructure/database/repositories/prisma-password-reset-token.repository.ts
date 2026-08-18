import type {
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../../../domain/repositories/password-reset-token.repository';
import { prisma } from '../prisma.client';

function mapToken(record: {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}): PasswordResetTokenRecord {
  return {
    id: record.id,
    userId: record.userId,
    tokenHash: record.tokenHash,
    expiresAt: record.expiresAt,
    usedAt: record.usedAt,
    createdAt: record.createdAt,
  };
}

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  async create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetTokenRecord> {
    const token = await prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return mapToken(token);
  }

  async findValidByTokenHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    const token = await prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return token ? mapToken(token) : null;
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt },
    });
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    await prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}
