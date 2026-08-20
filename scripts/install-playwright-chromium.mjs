/**
 * Ensures Playwright Chromium is available for API PDF generation.
 * Runs on root postinstall — no manual `npx playwright install` needed.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensurePlaywrightChromiumReady,
  resolveMonorepoRoot,
} from './playwright-chromium-utils.mjs';

const root = resolveMonorepoRoot(join(dirname(fileURLToPath(import.meta.url)), '..'));

console.log('[playwright] Installing Chromium for vector PDF generation…');

const result = await ensurePlaywrightChromiumReady({ root, strict: true });

if (!result.ok) {
  console.error(
    '[playwright] Chromium setup failed. Retry with: npm run install:pdf-engine',
  );
  process.exit(1);
}

console.log('[playwright] Chromium ready for PDF generation.');
