import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function resolvePrismaDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() ||
    process.env.DATABASE_URL_LOCAL?.trim() ||
    process.env.DATABASE_URL_CLOUD?.trim();

  if (!url) {
    throw new Error(
      '[db] DATABASE_URL is not set. Configure DATABASE_URL or hybrid DATABASE_URL_LOCAL / DATABASE_URL_CLOUD.',
    );
  }

  return url;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: { url: resolvePrismaDatabaseUrl() },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
