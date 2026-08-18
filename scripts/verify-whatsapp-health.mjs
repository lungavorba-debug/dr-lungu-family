/**
 * Calls GET /api/webhooks/meta/whatsapp/health and prints the JSON response.
 * Usage: npm run verify:whatsapp:health
 *
 * Requires API running (default http://localhost:3001).
 * Override: API_PORT=3001 node scripts/verify-whatsapp-health.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const port = process.env.API_PORT?.trim() || '3001';
const healthUrl = `http://localhost:${port}/api/webhooks/meta/whatsapp/health`;

async function main() {
  console.log(`[verify:whatsapp:health] GET ${healthUrl}`);

  try {
    const response = await fetch(healthUrl, {
      headers: { Accept: 'application/json' },
    });
    const body = await response.json();

    console.log(
      JSON.stringify(
        {
          httpStatus: response.status,
          ok: response.ok,
          ...body,
        },
        null,
        2,
      ),
    );

    if (!response.ok || body.status === 'degraded' || body.status === 'not_configured') {
      console.error('\n[verify:whatsapp:health] Health check reported issues. See issues[] above.');
      process.exit(1);
    }

    console.log('\n[verify:whatsapp:health] ✓ WhatsApp health endpoint OK.');
    process.exit(0);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[verify:whatsapp:health] Failed to reach API: ${message}`);
    console.error('Start the API first: npm run dev:api');
    process.exit(1);
  }
}

main();
