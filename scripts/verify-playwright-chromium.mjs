/**
 * Verifies Playwright Chromium can launch (used by postinstall and CI checks).
 */
import { verifyPlaywrightChromiumLaunch } from './playwright-chromium-utils.mjs';

const result = await verifyPlaywrightChromiumLaunch();

if (!result.ok) {
  console.error('[playwright] Chromium launch failed:', result.error ?? 'unknown error');
  process.exit(1);
}

console.log('[playwright] Chromium launch OK.');
