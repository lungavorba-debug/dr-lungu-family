/**
 * Shared Playwright Chromium discovery, install, and verify helpers.
 */
import { spawnSync } from 'node:child_process';
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

export function findPlaywrightCli(root = resolveMonorepoRoot()) {
  const candidates = [
    join(root, 'node_modules', 'playwright', 'cli.js'),
    join(root, 'apps', 'api', 'node_modules', 'playwright', 'cli.js'),
    join(root, 'node_modules', '@medscreen', 'api', 'node_modules', 'playwright', 'cli.js'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

export function playwrightInstallArgs() {
  const args = ['install', 'chromium'];
  if (process.platform === 'linux') {
    args.push('--with-deps');
  }
  return args;
}

export function installPlaywrightChromium(options = {}) {
  const { root = resolveMonorepoRoot(), strict = false } = options;
  const apiDir = join(root, 'apps', 'api');

  if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
    const message = '[playwright] Skipping Chromium download (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1).';
    console.log(message);
    return strict ? { ok: false, skipped: true, message } : { ok: true, skipped: true, message };
  }

  const installArgs = playwrightInstallArgs();
  const playwrightCli = findPlaywrightCli(root);

  let installResult;

  if (playwrightCli) {
    installResult = spawnSync(process.execPath, [playwrightCli, ...installArgs], {
      cwd: apiDir,
      stdio: 'inherit',
      env: process.env,
    });
  } else {
    console.warn('[playwright] CLI not found in node_modules — falling back to npx playwright install chromium');
    installResult = spawnSync('npx', ['playwright', ...installArgs], {
      cwd: apiDir,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: process.env,
    });
  }

  if (installResult.status !== 0) {
    const message =
      '[playwright] Chromium install failed. PDF generation will retry automatically on next request.';
    console.error(message);
    return { ok: false, skipped: false, message };
  }

  return { ok: true, skipped: false, message: '[playwright] Chromium install finished.' };
}

export async function verifyPlaywrightChromiumLaunch() {
  const { chromium } = await import('playwright');

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function ensurePlaywrightChromiumReady(options = {}) {
  const verify = await verifyPlaywrightChromiumLaunch();
  if (verify.ok) {
    return { ok: true, installed: false };
  }

  console.warn('[playwright] Chromium unavailable:', verify.error ?? 'launch failed');
  const install = installPlaywrightChromium(options);
  if (!install.ok) {
    return { ok: false, installed: false, error: install.message };
  }

  const verifyAfter = await verifyPlaywrightChromiumLaunch();
  if (!verifyAfter.ok) {
    return {
      ok: false,
      installed: true,
      error: verifyAfter.error ?? 'Chromium still unavailable after install',
    };
  }

  console.log('[playwright] Chromium ready for PDF generation.');
  return { ok: true, installed: true };
}
