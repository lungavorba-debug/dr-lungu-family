/**
 * WhatsApp Business Cloud API verification.
 * Usage: npm run verify:whatsapp
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, 'apps/api/.env') });

function mark(checks, name, pass, detail = '') {
  checks[name] = { pass, detail };
}

function isConfigured() {
  return Boolean(
    process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() &&
      process.env.WHATSAPP_ACCESS_TOKEN?.trim(),
  );
}

async function verifyGraphPhoneNumber(checks) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

  if (!token || !phoneNumberId) {
    mark(checks, 'graph_token_valid', false, 'missing credentials');
    mark(checks, 'phone_number_id_resolves', false, 'missing credentials');
    mark(checks, 'whatsapp_registration_status', false, 'unknown');
    return { issues: [], warnings: [] };
  }

  const issues = [];
  const warnings = [];

  try {
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,status,code_verification_status`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const body = await response.json();

    if (!response.ok) {
      const metaMessage = body.error?.message ?? `HTTP ${response.status}`;
      mark(checks, 'graph_token_valid', false, metaMessage);
      mark(checks, 'phone_number_id_resolves', false, metaMessage);
      mark(checks, 'whatsapp_registration_status', false, 'unknown');
      issues.push(`Graph API: ${metaMessage}`);

      if (body.error?.code === 133010 || /account not registered/i.test(metaMessage)) {
        issues.push(
          'Numărul WhatsApp Business nu este înregistrat/activat în Cloud API (133010). Finalizează setup-ul în Meta App Dashboard.',
        );
      }

      if (body.error?.code === 190 || /access token/i.test(metaMessage)) {
        issues.push('WHATSAPP_ACCESS_TOKEN invalid sau expirat.');
      }

      return { issues, warnings };
    }

    mark(checks, 'graph_token_valid', true, body.verified_name ?? body.display_phone_number ?? 'ok');
    mark(checks, 'phone_number_id_resolves', true, body.display_phone_number ?? phoneNumberId);

    const status = body.status ?? 'unknown';
    mark(checks, 'whatsapp_registration_status', !body.status || body.status === 'CONNECTED', status);

    if (body.status && body.status !== 'CONNECTED') {
      issues.push(`Status număr WhatsApp: ${body.status} (necesită CONNECTED).`);
    }

    if (body.code_verification_status && body.code_verification_status !== 'VERIFIED') {
      warnings.push(`Code verification status: ${body.code_verification_status}`);
    }

    return { issues, warnings };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    mark(checks, 'graph_token_valid', false, message);
    mark(checks, 'phone_number_id_resolves', false, message);
    mark(checks, 'whatsapp_registration_status', false, 'unknown');
    issues.push(message);
    return { issues, warnings };
  }
}

async function main() {
  const checks = {};
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v21.0';

  mark(checks, 'whatsapp_phone_number_id', Boolean(phoneNumberId), phoneNumberId ?? 'missing');
  mark(checks, 'whatsapp_access_token', Boolean(accessToken), accessToken ? 'set' : 'missing');
  mark(checks, 'whatsapp_api_version', Boolean(apiVersion), apiVersion);
  mark(
    checks,
    'whatsapp_business_account_id',
    Boolean(businessAccountId),
    businessAccountId ?? 'optional — not set',
  );
  mark(checks, 'whatsapp_configured', isConfigured(), isConfigured() ? 'WhatsApp Cloud API' : 'Not configured');

  if (!isConfigured()) {
    console.log(JSON.stringify({ status: 'skipped', checks }, null, 2));
    process.exit(0);
  }

  const { issues, warnings } = await verifyGraphPhoneNumber(checks);

  const allRequiredPass = [
    'whatsapp_phone_number_id',
    'whatsapp_access_token',
    'graph_token_valid',
    'whatsapp_registration_status',
  ].every((key) => checks[key]?.pass);

  console.log(
    JSON.stringify(
      {
        status: allRequiredPass ? 'passed' : 'failed',
        provider: 'WhatsApp Cloud API',
        checks,
        issues,
        warnings,
        guidance:
          issues.some((issue) => issue.includes('133010')) ||
          checks.whatsapp_registration_status?.detail !== 'CONNECTED'
            ? [
                'Finalizează înregistrarea numărului în Meta → WhatsApp → API Setup.',
                'Dacă aplicația este în Development, adaugă numărul destinatar ca test phone number.',
                'Health endpoint: GET /api/webhooks/meta/whatsapp/health',
              ]
            : [],
      },
      null,
      2,
    ),
  );

  process.exit(allRequiredPass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
