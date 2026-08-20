/**
 * Local install hook — skipped in CI/deployment (use npm ci --ignore-scripts + render-build.mjs).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (
  process.env.CI === 'true' ||
  process.env.RENDER === 'true' ||
  process.env.VERCEL === '1' ||
  process.env.SKIP_POSTINSTALL === '1'
) {
  console.log('[postinstall] Skipping hooks in CI/deployment environment.');
  process.exit(0);
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD ?? 'true',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npx', ['prisma', 'generate']);

const playwrightInstaller = join(root, 'scripts/install-playwright-chromium.mjs');
if (existsSync(playwrightInstaller)) {
  run(process.execPath, [playwrightInstaller]);
}
