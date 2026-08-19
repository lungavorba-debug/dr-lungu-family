/**
 * Reset an administrator (or any user) password directly in the database.
 *
 * Usage:
 *   npm run reset:admin-password -- --email admin@medscreen.ro --password "NewSecurePass123!"
 *
 * Environment fallbacks:
 *   MEDSCREEN_ADMIN_EMAIL
 *   MEDSCREEN_ADMIN_PASSWORD
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1 || index + 1 >= process.argv.length) {
    return undefined;
  }
  return process.argv[index + 1];
}

async function main() {
  const email = (readArg('--email') ?? process.env.MEDSCREEN_ADMIN_EMAIL ?? 'admin@medscreen.ro')
    .trim()
    .toLowerCase();
  const password = readArg('--password') ?? process.env.MEDSCREEN_ADMIN_PASSWORD;

  if (!password?.trim()) {
    console.error('[reset-admin-password] Missing password.');
    console.error('Provide --password "..." or set MEDSCREEN_ADMIN_PASSWORD.');
    process.exit(1);
  }

  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      console.error(`[reset-admin-password] No user found for email: ${email}`);
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password.trim(), SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        active: true,
        mustChangePassword: false,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
        tokenVersion: { increment: 1 },
      },
    });

    console.log('[reset-admin-password] Password updated successfully.');
    console.log(`  Email: ${email}`);
    console.log(`  Role:  ${user.role.name}`);
    console.log('  Account unlocked and active sessions invalidated.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[reset-admin-password] Failed:', error);
  process.exit(1);
});
