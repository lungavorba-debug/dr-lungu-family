import dotenv from 'dotenv';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

type DbStats = {
  label: string;
  reachable: boolean;
  error?: string;
  users?: number;
  patients?: number;
  screenings?: number;
  campaigns?: number;
  screeningsByDate?: { d: string; count: number }[];
  aug21to23?: number;
  screeningIds?: string[];
};

async function probeDatabase(label: string, databaseUrl: string, directUrl?: string): Promise<DbStats> {
  const prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

  try {
    await prisma.$queryRawUnsafe('SELECT 1');

    const [users, patients, screenings, campaigns] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.screening.count(),
      prisma.campaign.count(),
    ]);

    const screeningsByDate = await prisma.$queryRawUnsafe<{ d: Date; count: bigint }[]>(
      `SELECT created_at::date AS d, COUNT(*)::bigint AS count
       FROM screenings
       GROUP BY 1
       ORDER BY 1`,
    );

    const aug21to23Rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*)::bigint AS count
       FROM screenings
       WHERE created_at >= '2026-08-21'::date
         AND created_at < '2026-08-24'::date`,
    );

    const augIds = await prisma.$queryRawUnsafe<{ id: string; created_at: Date }[]>(
      `SELECT id, created_at
       FROM screenings
       WHERE created_at >= '2026-08-21'::date
         AND created_at < '2026-08-24'::date
       ORDER BY created_at`,
    );

    return {
      label,
      reachable: true,
      users,
      patients,
      screenings,
      campaigns,
      screeningsByDate: screeningsByDate.map((row) => ({
        d: row.d.toISOString().slice(0, 10),
        count: Number(row.count),
      })),
      aug21to23: Number(aug21to23Rows[0]?.count ?? 0),
      screeningIds: augIds.map((row) => row.id),
    };
  } catch (error) {
    return {
      label,
      reachable: false,
      error: error instanceof Error ? error.message.split('\n')[0] : String(error),
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const localUrl = process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL;
  const cloudUrl = process.env.DATABASE_URL_CLOUD;
  const cloudDirect = process.env.DIRECT_URL_CLOUD ?? cloudUrl;

  if (!localUrl) {
    throw new Error('DATABASE_URL_LOCAL or DATABASE_URL is required.');
  }

  console.log('=== MedScreen database audit ===\n');

  const local = await probeDatabase('local', localUrl, process.env.DIRECT_URL_LOCAL ?? localUrl);
  console.log('LOCAL:', JSON.stringify(local, null, 2));

  if (cloudUrl) {
    let cloud = await probeDatabase('cloud-pooler', cloudUrl);
    if (!cloud.reachable && cloudDirect && cloudDirect !== cloudUrl) {
      cloud = await probeDatabase('cloud-direct', cloudDirect);
    }
    console.log('\nCLOUD:', JSON.stringify(cloud, null, 2));
  } else {
    console.log('\nCLOUD: not configured');
  }
}

void main();
