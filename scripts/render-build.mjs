/**
 * Render.com API build pipeline — always runs from monorepo root.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { resolveMonorepoRoot } from './resolve-monorepo-root.mjs';

const root = resolveMonorepoRoot();

if (!existsSync(`${root}/package.json`) || !existsSync(`${root}/apps/api/package.json`)) {
  console.error('[render-build] Invalid monorepo root:', root);
  process.exit(1);
}

console.log(`[render-build] Monorepo root: ${root}`);

const deployEnv = {
  ...process.env,
  PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD ?? 'true',
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD ?? '1',
  SKIP_POSTINSTALL: process.env.SKIP_POSTINSTALL ?? '1',
};

function run(label, command, args = [], options = {}) {
  console.log(`[render-build] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: deployEnv,
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm ci --ignore-scripts', 'npm', ['ci', '--ignore-scripts']);
run('npm rebuild bcrypt', 'npm', ['rebuild', 'bcrypt']);
run('prisma generate', 'npx', ['prisma', 'generate']);
run('build workspace packages', 'npm', ['run', 'build:packages']);
run('build API', 'npm', ['run', 'build', '--workspace=@medscreen/api']);

run('install Playwright Chromium', process.execPath, [
  join(root, 'scripts/install-playwright-chromium.mjs'),
], {
  env: {
    ...process.env,
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined,
    SKIP_POSTINSTALL: undefined,
  },
});

console.log('[render-build] Done.');
