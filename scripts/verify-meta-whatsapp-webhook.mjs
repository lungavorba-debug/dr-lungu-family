/**
 * Meta WhatsApp webhook verification.
 * Usage: node scripts/verify-meta-whatsapp-webhook.mjs
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

const API_BASE = process.env.API_URL?.replace(/\/api\/v1\/?$/, '') ?? 'http://127.0.0.1:3001';
const WEBHOOK_BASE = `${API_BASE}/api/webhooks/meta/whatsapp`;

const checks = {};

function mark(name, pass, detail = '') {
  checks[name] = { pass, detail };
}

async function main() {
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();
  mark('verify_token_configured', Boolean(verifyToken), verifyToken ? 'set' : 'missing');

  const healthResponse = await fetch(`${WEBHOOK_BASE}/health`);
  const healthBody = await healthResponse.json();
  mark(
    'health_endpoint',
    healthResponse.status === 200 && healthBody.status === 'ok',
    JSON.stringify(healthBody),
  );

  const challenge = 'meta-challenge-12345';
  const validUrl = new URL(WEBHOOK_BASE);
  validUrl.searchParams.set('hub.mode', 'subscribe');
  validUrl.searchParams.set('hub.verify_token', verifyToken ?? '');
  validUrl.searchParams.set('hub.challenge', challenge);

  const validResponse = await fetch(validUrl);
  const validBody = await validResponse.text();
  mark(
    'verify_valid_token',
    validResponse.status === 200 && validBody === challenge,
    `status=${validResponse.status} body=${validBody}`,
  );

  const invalidUrl = new URL(WEBHOOK_BASE);
  invalidUrl.searchParams.set('hub.mode', 'subscribe');
  invalidUrl.searchParams.set('hub.verify_token', 'wrong-token');
  invalidUrl.searchParams.set('hub.challenge', challenge);

  const invalidResponse = await fetch(invalidUrl);
  mark('verify_invalid_token_403', invalidResponse.status === 403, `status=${invalidResponse.status}`);

  const postResponse = await fetch(WEBHOOK_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'verify-test',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: 'test-phone-id' },
                messages: [
                  {
                    from: '40700000000',
                    id: 'wamid.verify.test',
                    timestamp: '1710000001',
                    type: 'text',
                    text: { body: 'webhook verify ping' },
                  },
                ],
              },
            },
          ],
        },
      ],
    }),
  });
  mark('post_webhook_200', postResponse.status === 200, `status=${postResponse.status}`);

  const passed = Object.values(checks).every((check) => check.pass);
  console.log(
    JSON.stringify(
      {
        status: passed ? 'passed' : 'failed',
        callbackUrl: WEBHOOK_BASE,
        verifyToken: verifyToken ?? null,
        webhookRoute: '/api/webhooks/meta/whatsapp',
        checks,
      },
      null,
      2,
    ),
  );
  process.exit(passed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
