import dns from 'node:dns/promises';
import net from 'node:net';

export type DatabaseEnvMode = 'local' | 'cloud' | 'auto';

export interface DatabaseEnvTarget {
  label: 'local' | 'cloud';
  databaseUrl: string;
  directUrl: string;
}

const REACHABILITY_TIMEOUT_MS = 2_500;

function readTrimmed(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function parsePostgresHostPort(databaseUrl: string): { host: string; port: number } | null {
  const match = databaseUrl.match(/^postgres(?:ql)?:\/\/[^@]+@([^:/]+)(?::(\d+))?/i);
  if (!match?.[1]) {
    return null;
  }

  return {
    host: match[1],
    port: match[2] ? Number(match[2]) : 5432,
  };
}

async function canReachPostgresHost(host: string, port: number): Promise<boolean> {
  try {
    await dns.lookup(host);
  } catch {
    return false;
  }

  return new Promise((resolve) => {
    const socket = net.connect({ host, port });

    const finish = (reachable: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(reachable);
    };

    const timer = setTimeout(() => finish(false), REACHABILITY_TIMEOUT_MS);

    socket.once('connect', () => {
      clearTimeout(timer);
      finish(true);
    });

    socket.once('error', () => {
      clearTimeout(timer);
      finish(false);
    });
  });
}

async function isDatabaseTargetReachable(target: DatabaseEnvTarget): Promise<boolean> {
  const endpoint = parsePostgresHostPort(target.databaseUrl);
  if (!endpoint) {
    return false;
  }

  return canReachPostgresHost(endpoint.host, endpoint.port);
}

function applyDatabaseEnv(target: DatabaseEnvTarget): void {
  process.env.DATABASE_URL = target.databaseUrl;
  process.env.DIRECT_URL = target.directUrl;
}

function readHybridTargets(): { local?: DatabaseEnvTarget; cloud?: DatabaseEnvTarget } {
  const localDatabaseUrl = readTrimmed('DATABASE_URL_LOCAL');
  const localDirectUrl = readTrimmed('DIRECT_URL_LOCAL') ?? localDatabaseUrl;
  const cloudDatabaseUrl = readTrimmed('DATABASE_URL_CLOUD');
  const cloudDirectUrl = readTrimmed('DIRECT_URL_CLOUD') ?? cloudDatabaseUrl;

  return {
    local:
      localDatabaseUrl != null
        ? {
            label: 'local',
            databaseUrl: localDatabaseUrl,
            directUrl: localDirectUrl ?? localDatabaseUrl,
          }
        : undefined,
    cloud:
      cloudDatabaseUrl != null
        ? {
            label: 'cloud',
            databaseUrl: cloudDatabaseUrl,
            directUrl: cloudDirectUrl ?? cloudDatabaseUrl,
          }
        : undefined,
  };
}

function readDatabaseMode(): DatabaseEnvMode {
  const mode = readTrimmed('MEDSCREEN_DB_MODE')?.toLowerCase();
  if (mode === 'local' || mode === 'cloud' || mode === 'auto') {
    return mode;
  }

  return 'auto';
}

/**
 * Resolves DATABASE_URL / DIRECT_URL before Prisma initializes.
 *
 * - `local` / `cloud`: fixed target (fails fast if unreachable).
 * - `auto`: prefers cloud when reachable, otherwise local (festival-safe fallback).
 *
 * When hybrid vars are absent, existing DATABASE_URL is left unchanged.
 */
export async function resolveDatabaseEnv(): Promise<void> {
  const { local, cloud } = readHybridTargets();
  if (!local && !cloud) {
    return;
  }

  const mode = readDatabaseMode();

  if (mode === 'local') {
    if (!local) {
      throw new Error('[db] MEDSCREEN_DB_MODE=local but DATABASE_URL_LOCAL is not set.');
    }
    applyDatabaseEnv(local);
    console.log('[db] Mode: local — using Docker PostgreSQL.');
    return;
  }

  if (mode === 'cloud') {
    if (!cloud) {
      throw new Error('[db] MEDSCREEN_DB_MODE=cloud but DATABASE_URL_CLOUD is not set.');
    }
    applyDatabaseEnv(cloud);
    console.log('[db] Mode: cloud — using Supabase PostgreSQL.');
    return;
  }

  if (cloud && (await isDatabaseTargetReachable(cloud))) {
    applyDatabaseEnv(cloud);
    console.log('[db] Mode: auto — cloud reachable, using Supabase PostgreSQL.');
    return;
  }

  if (local) {
    applyDatabaseEnv(local);
    console.warn(
      cloud
        ? '[db] Mode: auto — cloud unreachable, falling back to local Docker PostgreSQL.'
        : '[db] Mode: auto — using local Docker PostgreSQL.',
    );
    return;
  }

  if (!cloud) {
    throw new Error('[db] MEDSCREEN_DB_MODE=auto but no DATABASE_URL_LOCAL or DATABASE_URL_CLOUD is set.');
  }

  applyDatabaseEnv(cloud);
  console.warn('[db] Mode: auto — local fallback missing; using cloud URL (may fail offline).');
}
