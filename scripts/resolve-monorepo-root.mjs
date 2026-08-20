/**
 * Resolve monorepo root whether Render/npm cwd is repo root or apps/api (legacy dashboard rootDir).
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptsDir = dirname(fileURLToPath(import.meta.url));

export function resolveMonorepoRoot(startDir = process.cwd()) {
  const normalized = startDir.replace(/\\/g, '/');

  if (normalized.endsWith('/apps/api')) {
    return join(startDir, '..', '..');
  }

  if (existsSync(join(startDir, 'package.json')) && existsSync(join(startDir, 'apps/api/package.json'))) {
    return startDir;
  }

  if (existsSync(join(scriptsDir, '..', 'package.json'))) {
    return join(scriptsDir, '..');
  }

  return startDir;
}

export function resolveApiServerEntry(root = resolveMonorepoRoot()) {
  const fromRoot = join(root, 'apps/api/dist/server.js');
  if (existsSync(fromRoot)) {
    return fromRoot;
  }

  const fromApiRoot = join(root, 'dist/server.js');
  if (existsSync(fromApiRoot)) {
    return fromApiRoot;
  }

  return fromRoot;
}
