/**
 * Vercel frontend build pipeline (monorepo root).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const deployEnv = {
  ...process.env,
  PUPPETEER_SKIP_DOWNLOAD: process.env.PUPPETEER_SKIP_DOWNLOAD ?? 'true',
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD ?? '1',
};

function run(label, command, args = []) {
  console.log(`[vercel-build] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: deployEnv,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('npm ci --ignore-scripts', 'npm', ['ci', '--ignore-scripts']);
run('build web workspace', 'npm', ['run', 'build', '--workspace=@medscreen/web']);

console.log('[vercel-build] Done.');
