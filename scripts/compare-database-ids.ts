import dotenv from 'dotenv';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

function createClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

async function listIds(prisma: PrismaClient, table: string): Promise<Set<string>> {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT id::text AS id FROM ${table}`);
  return new Set(rows.map((row) => row.id));
}

async function main(): Promise<void> {
  const localUrl = process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL;
  const cloudUrl = process.env.DATABASE_URL_CLOUD;
  if (!localUrl || !cloudUrl) throw new Error('DATABASE_URL_LOCAL and DATABASE_URL_CLOUD required');

  const local = createClient(localUrl);
  const cloud = createClient(cloudUrl);

  try {
    const tables = ['campaigns', 'patients', 'screenings', 'screening_deliveries', 'users'] as const;
    const diff: Record<string, { localOnly: number; cloudOnly: number; shared: number }> = {};

    for (const table of tables) {
      const localIds = await listIds(local, table);
      const cloudIds = await listIds(cloud, table);
      const localOnly = [...localIds].filter((id) => !cloudIds.has(id));
      const cloudOnly = [...cloudIds].filter((id) => !localIds.has(id));
      const shared = [...localIds].filter((id) => cloudIds.has(id)).length;
      diff[table] = { localOnly: localOnly.length, cloudOnly: cloudOnly.length, shared };
    }

    const localScreeningDates = await local.$queryRawUnsafe<{ d: string; c: bigint }[]>(
      `SELECT created_at::date::text AS d, COUNT(*)::bigint AS c FROM screenings GROUP BY 1 ORDER BY 1`,
    );
    const cloudScreeningDates = await cloud.$queryRawUnsafe<{ d: string; c: bigint }[]>(
      `SELECT created_at::date::text AS d, COUNT(*)::bigint AS c FROM screenings GROUP BY 1 ORDER BY 1`,
    );

    console.log(JSON.stringify({ diff, localScreeningDates, cloudScreeningDates }, (_k, v) => typeof v === 'bigint' ? Number(v) : v, 2));
  } finally {
    await local.$disconnect();
    await cloud.$disconnect();
  }
}

void main();
