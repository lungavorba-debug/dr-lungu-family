/**
 * Ensures Playwright Chromium is available for API PDF generation.
 * Invoked from root postinstall and Docker production build.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(root, 'apps', 'api');

if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
  console.log('[playwright] Skipping Chromium download (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).');
  process.exit(0);
}

const playwrightCli = join(root, 'node_modules', 'playwright', 'cli.js');
if (!existsSync(playwrightCli)) {
  console.warn(
    '[playwright] Package not found. Run npm install from the repo root before generating PDFs.',
  );
  process.exit(0);
}

console.log('[playwright] Installing Chromium for PDF generation…');

const result = spawnSync(process.execPath, [playwrightCli, 'install', 'chromium'], {
  cwd: apiDir,
  stdio: 'inherit',
  env: process.env,
});

if (result.status !== 0) {
  console.warn(
    '[playwright] Chromium install failed. PDF generation will be unavailable until you run: npm run install:pdf-engine',
  );
  process.exit(0);
}

console.log('[playwright] Chromium ready.');
