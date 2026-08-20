/**
 * Render.com start — works with repo root OR legacy apps/api root directory.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolveApiServerEntry, resolveMonorepoRoot } from './resolve-monorepo-root.mjs';

const root = resolveMonorepoRoot();
const serverEntry = resolveApiServerEntry(root);

if (!existsSync(serverEntry)) {
  console.error(`[render-start] Server entry not found: ${serverEntry}`);
  console.error(`[render-start] Monorepo root: ${root}`);
  console.error('[render-start] Run the build step before start.');
  process.exit(1);
}

const port = process.env.PORT || process.env.API_PORT || '3001';

console.log(`[render-start] root=${root}`);
console.log(`[render-start] entry=${serverEntry}`);
console.log(`[render-start] API_PORT=${port}`);

const child = spawn(process.execPath, [serverEntry], {
  cwd: root,
  stdio: 'inherit',
  env: {
    ...process.env,
    API_PORT: String(port),
    API_HOST: process.env.API_HOST || '0.0.0.0',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 1);
});
