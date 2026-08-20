/**
 * Fast check used by dev/start hooks — installs Chromium only when missing.
 */
import { ensurePlaywrightChromiumReady } from './playwright-chromium-utils.mjs';

const result = await ensurePlaywrightChromiumReady({ strict: false });

if (!result.ok) {
  console.warn('[pdf-engine] Chromium is not ready yet:', result.error ?? 'unknown error');
  console.warn('[pdf-engine] The API will retry automatically when generating PDFs.');
  process.exit(0);
}

if (result.installed) {
  console.log('[pdf-engine] Chromium was installed successfully.');
}
