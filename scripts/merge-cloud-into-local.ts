/**
 * Safe one-way merge: Supabase (cloud) → local Docker PostgreSQL.
 * Uses INSERT ... ON CONFLICT (id) DO NOTHING — never deletes or overwrites rows.
 *
 * Usage: npx tsx scripts/merge-cloud-into-local.ts
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.join(process.cwd(), '.env'), override: true });

type MergeStats = {
  fetched: number;
  inserted: number;
  skipped: number;
  errors: number;
};

type ColumnMeta = {
  name: string;
  cast: string;
};

function createClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasources: { db: { url: databaseUrl } } });
}

function castForColumn(udtName: string, dataType: string): string {
  if (udtName === 'uuid') return '::uuid';
  if (udtName === 'jsonb') return '::jsonb';
  if (udtName === 'numeric') return '::numeric';
  if (dataType === 'integer') return '::int';
  if (dataType === 'boolean') return '::boolean';
  if (dataType.includes('timestamp')) return '::timestamptz';
  if (dataType === 'date') return '::date';
  return '';
}

async function getColumnMeta(local: PrismaClient, table: string): Promise<ColumnMeta[]> {
  const rows = await local.$queryRawUnsafe<
    { column_name: string; data_type: string; udt_name: string }[]
  >(
    `SELECT column_name, data_type, udt_name
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    table,
  );

  return rows.map((row) => ({
    name: row.column_name,
    cast: castForColumn(row.udt_name, row.data_type),
  }));
}

function serializeCellValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'object') {
    const decimalLike = value as {
      toFixed?: (digits?: number) => string;
      toNumber?: () => number;
    };
    if (typeof decimalLike.toNumber === 'function') {
      return decimalLike.toNumber();
    }
    if (typeof decimalLike.toFixed === 'function') {
      return decimalLike.toFixed();
    }

    return JSON.stringify(value);
  }

  return value;
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

async function mergeUsers(
  local: PrismaClient,
  cloud: PrismaClient,
  columnMeta: ColumnMeta[],
): Promise<MergeStats> {
  const stats: MergeStats = { fetched: 0, inserted: 0, skipped: 0, errors: 0 };

  const localRoles = await local.$queryRaw<{ id: string; name: string }[]>`
    SELECT id::text AS id, name FROM roles
  `;
  const roleIdByName = new Map(localRoles.map((role) => [role.name, role.id]));

  const rows = await cloud.$queryRawUnsafe<
    (Record<string, unknown> & { role_name: string })[]
  >(
    `SELECT u.*, r.name AS role_name
     FROM users u
     INNER JOIN roles r ON u."roleId" = r.id`,
  );

  stats.fetched = rows.length;
  const columns = columnMeta.map((c) => c.name);
  const columnList = columns.map(quoteIdent).join(', ');
  const placeholders = columnMeta
    .map((col, index) => {
      const param = `$${index + 1}`;
      return col.cast ? `${param}${col.cast}` : param;
    })
    .join(', ');

  for (const row of rows) {
    const localRoleId = roleIdByName.get(row.role_name);
    if (!localRoleId) {
      stats.errors += 1;
      continue;
    }

    row.roleId = localRoleId;
    delete row.role_name;

    const values = columns.map((col) => serializeCellValue(row[col]));

    try {
      const result = await local.$executeRawUnsafe(
        `INSERT INTO users (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        ...values,
      );
      if (result === 1) stats.inserted += 1;
      else stats.skipped += 1;
    } catch (error) {
      handleMergeError(error, 'users', stats);
    }
  }

  return stats;
}

function handleMergeError(error: unknown, table: string, stats: MergeStats): void {
  const message = error instanceof Error ? error.message : String(error);
  const metaMessage =
    typeof error === 'object' &&
    error !== null &&
    'meta' in error &&
    typeof (error as { meta?: { message?: string } }).meta?.message === 'string'
      ? (error as { meta: { message: string } }).meta.message
      : '';
  const full = `${message} ${metaMessage}`.trim();
  if (
    full.includes('users_email_key') ||
    full.includes('patients_phone_key') ||
    full.includes('duplicate key')
  ) {
    stats.skipped += 1;
  } else {
    stats.errors += 1;
    if (stats.errors <= 5) {
      console.error(`[merge] ${table} error:`, full.split('\n').slice(0, 2).join(' | '));
    }
  }
}

async function buildPatientIdRemap(
  local: PrismaClient,
  cloud: PrismaClient,
): Promise<Map<string, string>> {
  const remap = new Map<string, string>();

  const localPatients = await local.$queryRaw<{ id: string; phone: string }[]>`
    SELECT id::text AS id, phone FROM patients
  `;
  const localById = new Map(localPatients.map((p) => [p.id, p.id]));
  const localByPhone = new Map(localPatients.map((p) => [p.phone, p.id]));

  const cloudPatients = await cloud.$queryRaw<{ id: string; phone: string }[]>`
    SELECT id::text AS id, phone FROM patients
  `;

  for (const patient of cloudPatients) {
    if (localById.has(patient.id)) {
      remap.set(patient.id, patient.id);
      continue;
    }

    const byPhone = localByPhone.get(patient.phone);
    remap.set(patient.id, byPhone ?? patient.id);
  }

  return remap;
}

async function mergeScreenings(
  local: PrismaClient,
  cloud: PrismaClient,
  columnMeta: ColumnMeta[],
  patientIdRemap: Map<string, string>,
): Promise<MergeStats> {
  const stats: MergeStats = { fetched: 0, inserted: 0, skipped: 0, errors: 0 };
  const rows = await cloud.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM screenings`);
  stats.fetched = rows.length;

  const columns = columnMeta.map((c) => c.name);
  const columnList = columns.map(quoteIdent).join(', ');
  const placeholders = columnMeta
    .map((col, index) => {
      const param = `$${index + 1}`;
      return col.cast ? `${param}${col.cast}` : param;
    })
    .join(', ');

  for (const row of rows) {
    const patientId = row.patient_id ?? row.patientId;
    if (typeof patientId === 'string') {
      row.patient_id = patientIdRemap.get(patientId) ?? patientId;
      delete row.patientId;
    }

    const values = columns.map((col) => serializeCellValue(row[col]));

    try {
      const result = await local.$executeRawUnsafe(
        `INSERT INTO screenings (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        ...values,
      );
      if (result === 1) stats.inserted += 1;
      else stats.skipped += 1;
    } catch (error) {
      handleMergeError(error, 'screenings', stats);
    }
  }

  return stats;
}

async function mergeTableById(
  local: PrismaClient,
  cloud: PrismaClient,
  table: string,
  columnMeta: ColumnMeta[],
): Promise<MergeStats> {
  const stats: MergeStats = { fetched: 0, inserted: 0, skipped: 0, errors: 0 };

  const rows = await cloud.$queryRawUnsafe<Record<string, unknown>[]>(`SELECT * FROM ${table}`);
  stats.fetched = rows.length;

  if (rows.length === 0) {
    return stats;
  }

  const columns = columnMeta.map((c) => c.name);
  const columnList = columns.map(quoteIdent).join(', ');
  const placeholders = columnMeta
    .map((col, index) => {
      const param = `$${index + 1}`;
      return col.cast ? `${param}${col.cast}` : param;
    })
    .join(', ');

  for (const row of rows) {
    const values = columns.map((col) => serializeCellValue(row[col]));

    try {
      const result = await local.$executeRawUnsafe(
        `INSERT INTO ${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`,
        ...values,
      );
      if (result === 1) {
        stats.inserted += 1;
      } else {
        stats.skipped += 1;
      }
    } catch (error) {
      handleMergeError(error, table, stats);
    }
  }

  return stats;
}

async function countTable(prisma: PrismaClient, table: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM ${table}`,
  );
  return Number(rows[0]?.count ?? 0);
}

async function countAug(prisma: PrismaClient, from: string, to: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint AS count FROM screenings
     WHERE created_at >= $1::date AND created_at < $2::date`,
    from,
    to,
  );
  return Number(rows[0]?.count ?? 0);
}

async function main(): Promise<void> {
  const localUrl = process.env.DATABASE_URL_LOCAL ?? process.env.DATABASE_URL;
  const cloudUrl = process.env.DATABASE_URL_CLOUD;

  if (!localUrl || !cloudUrl) {
    throw new Error('DATABASE_URL_LOCAL and DATABASE_URL_CLOUD must be set in .env');
  }

  const local = createClient(localUrl);
  const cloud = createClient(cloudUrl);

  console.log('=== MedScreen merge: cloud → local (non-destructive) ===\n');

  const before = {
    localScreenings: await countTable(local, 'screenings'),
    cloudScreenings: await countTable(cloud, 'screenings'),
    localAug2123: await countAug(local, '2026-08-21', '2026-08-24'),
  };

  console.log('Before:', before);

  const mergeOrder = ['users', 'patients', 'screenings', 'screening_deliveries', 'screening_ai_sessions'] as const;
  const results: Record<string, MergeStats> = {};

  try {
    const patientIdRemap = await buildPatientIdRemap(local, cloud);

    for (const table of mergeOrder) {
      const meta = await getColumnMeta(local, table);
      console.log(`\nMerging ${table} (${meta.length} columns)...`);
      if (table === 'users') {
        results[table] = await mergeUsers(local, cloud, meta);
      } else if (table === 'screenings') {
        results[table] = await mergeScreenings(local, cloud, meta, patientIdRemap);
      } else {
        results[table] = await mergeTableById(local, cloud, table, meta);
      }
      console.log(results[table]);
    }
  } finally {
    await local.$disconnect();
    await cloud.$disconnect();
  }

  const localAfter = createClient(localUrl);
  const after = {
    localScreenings: await countTable(localAfter, 'screenings'),
    localAug2123: await countAug(localAfter, '2026-08-21', '2026-08-24'),
    localAug19to23: await countAug(localAfter, '2026-08-19', '2026-08-24'),
  };
  await localAfter.$disconnect();

  console.log('\n=== Merge complete ===');
  console.log('Results:', JSON.stringify(results, null, 2));
  console.log('After:', after);
  console.log(`\nRecovered Aug 21–23 screenings in local: ${after.localAug2123} (was ${before.localAug2123})`);
}

void main().catch((error) => {
  console.error('[merge] Failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
