import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { chromium } from 'playwright';

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

function resolveRepoRoot(): string {
  const apiRoot = join(__dirname, '..', '..', '..');
  return join(apiRoot, '..', '..');
}

function resolveInstallScript(): string {
  return join(resolveRepoRoot(), 'scripts', 'install-playwright-chromium.mjs');
}

async function canLaunchChromium(): Promise<boolean> {
  let browser;

  try {
    browser = await chromium.launch({
      headless: true,
      args: LAUNCH_ARGS,
    });
    return true;
  } catch {
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

function runInstallScript(): boolean {
  const script = resolveInstallScript();
  if (!existsSync(script)) {
    console.error('[pdf] Install script missing:', script);
    return false;
  }

  console.warn('[pdf] Chromium missing — installing Playwright browser automatically…');

  const result = spawnSync(process.execPath, [script], {
    cwd: resolveRepoRoot(),
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: undefined,
    },
  });

  return result.status === 0;
}

let ready = false;
let ensuring: Promise<void> | null = null;

export async function ensurePlaywrightChromiumReady(): Promise<void> {
  if (ready) {
    return;
  }

  if (!ensuring) {
    ensuring = (async () => {
      if (await canLaunchChromium()) {
        ready = true;
        return;
      }

      if (!runInstallScript()) {
        throw new Error('Automatic Playwright Chromium install failed');
      }

      if (!(await canLaunchChromium())) {
        throw new Error('Playwright Chromium still unavailable after install');
      }

      ready = true;
      console.log('[pdf] Playwright Chromium ready.');
    })().finally(() => {
      ensuring = null;
    });
  }

  await ensuring;
}

export function resetPlaywrightChromiumReadyState(): void {
  ready = false;
  ensuring = null;
}
