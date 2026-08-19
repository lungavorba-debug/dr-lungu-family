/**
 * Render.com API build pipeline (also runnable locally after `npm ci --ignore-scripts`).
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

console.log('[render-build] Done.');
