export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface PasswordResetTokenRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<PasswordResetTokenRecord>;
  findValidByTokenHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  markUsed(id: string, usedAt: Date): Promise<void>;
  invalidateAllForUser(userId: string): Promise<void>;
}
