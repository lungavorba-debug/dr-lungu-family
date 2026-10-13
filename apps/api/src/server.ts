import dotenv from 'dotenv';
import path from 'node:path';
import { resolveDatabaseEnv } from './infrastructure/database/resolve-database-env';

const apiRoot = path.join(__dirname, '..');
const envFilePath = path.join(apiRoot, '../.env');

dotenv.config({ path: envFilePath, override: true });

async function startServer(): Promise<void> {
  await resolveDatabaseEnv();

  const {
    isWhatsAppDeliveryConfigured,
    parseApiEnvOrThrow,
    getEnvSmtpConfigStatus,
    getEnvWhatsAppConfigStatus,
    resolveSmtpProviderLabel,
    resolveWhatsAppProviderLabel,
    resolveWhatsAppWebhookCallbackUrl,
    shouldUseEtherealSmtp,
  } = await import('@medscreen/config');
  const { createApp } = await import('./app');
  const { getLanIPv4Addresses } = await import('./infrastructure/network/lan-addresses');
  const { whatsAppService } = await import('./services/whatsapp.service');
  const { ensureWhatsAppVerifyToken } = await import('./infrastructure/whatsapp/ensure-whatsapp-verify-token');
  const { checkWhatsAppCloudConfig, printWhatsAppCloudConfigCheck } = await import(
    './infrastructure/whatsapp/whatsapp-cloud-config.service'
  );
  const { ensurePlaywrightChromiumReady } = await import('./infrastructure/pdf/ensure-playwright-chromium');

  const whatsappVerifyToken = ensureWhatsAppVerifyToken(envFilePath);
  const env = parseApiEnvOrThrow();
  const app = createApp();

  function printApiLanBanner(port: number): void {
    const addresses = getLanIPv4Addresses();

    console.log('');
    console.log('══════════════════════════════════════════════════════');
    console.log('  MedScreen — Backend (API) — Local Network Access');
    console.log('══════════════════════════════════════════════════════');
    console.log(`  Local:   http://localhost:${port}/api/v1/health`);

    if (addresses.length === 0) {
      console.log('  Network: (no LAN IPv4 address detected)');
    } else {
      for (const [index, ip] of addresses.entries()) {
        const marker = index === 0 ? ' (recommended for phones/tablets)' : '';
        console.log(`  Network: http://${ip}:${port}/api/v1/health${marker}`);
      }
    }

    console.log('  CORS:    LAN dev origins allowed (development only)');
    console.log('  Connect: http://localhost:5173/connect (QR for volunteers)');
    console.log('══════════════════════════════════════════════════════');
    console.log('');
  }

  function printSmtpStartupBanner(): void {
    console.log('SMTP provider:');
    console.log(resolveSmtpProviderLabel(env));

    if (!shouldUseEtherealSmtp(env)) {
      const smtp = getEnvSmtpConfigStatus(env);
      console.log(`[smtp] SMTP_FROM_NAME: ${smtp.fromName ?? '(not set)'}`);
      console.log(`[smtp] SMTP_FROM_EMAIL: ${smtp.fromEmail ?? '(not set)'}`);
      console.log(`[smtp] SMTP_USER: ${smtp.user ?? '(not set)'}`);
      console.log(`[smtp] SMTP_PASS: ${smtp.passConfigured ? 'set' : '(not set)'}`);
      console.log(`[smtp] From header: ${smtp.fromAddress || '(not set)'}`);
    }
  }

  function printWhatsAppStartupBanner(): void {
    console.log('WhatsApp provider:');
    console.log(resolveWhatsAppProviderLabel(env));

    if (resolveWhatsAppProviderLabel(env) !== 'Not configured') {
      const wa = getEnvWhatsAppConfigStatus(env);
      console.log(`[whatsapp] WHATSAPP_PHONE_NUMBER_ID: ${wa.phoneNumberId ?? '(not set)'}`);
      console.log(`[whatsapp] WHATSAPP_BUSINESS_ACCOUNT_ID: ${wa.businessAccountId ?? '(not set)'}`);
      console.log(`[whatsapp] WHATSAPP_API_VERSION: ${wa.apiVersion}`);
      console.log(`[whatsapp] WHATSAPP_ACCESS_TOKEN: ${wa.accessTokenConfigured ? 'set' : '(not set)'}`);
    }

    const callbackUrl = resolveWhatsAppWebhookCallbackUrl(env);
    console.log('[whatsapp] Webhook route: POST/GET /api/webhooks/meta/whatsapp');
    console.log(`[whatsapp] Callback URL: ${callbackUrl}`);
    console.log(`[whatsapp] Verify Token: ${whatsappVerifyToken}`);
    console.log(`[whatsapp] Health: ${callbackUrl}/health`);
    console.log('[whatsapp-web] QR page: http://localhost:' + env.API_PORT + '/qr');
  }

  function shouldAutoInitializeWhatsAppWeb(): boolean {
    if (process.env.WHATSAPP_WEB_ENABLED === 'false') {
      return false;
    }

    if (process.env.PUPPETEER_SKIP_DOWNLOAD === 'true') {
      return false;
    }

    return true;
  }

  void ensurePlaywrightChromiumReady().catch((error: unknown) => {
    console.warn(
      '[pdf] Chromium preload failed — will retry automatically on first PDF request:',
      error instanceof Error ? error.message : error,
    );
  });

  app.listen(env.API_PORT, env.API_HOST, () => {
    console.log(`[api] Server listening on http://${env.API_HOST}:${env.API_PORT}`);
    printSmtpStartupBanner();
    printWhatsAppStartupBanner();
    if (shouldAutoInitializeWhatsAppWeb()) {
      whatsAppService.initialize();
    } else {
      console.log(
        '[whatsapp-web] Auto-init skipped (Puppeteer/Chrome unavailable). Use Setări → WhatsApp to connect manually on hosts with Chrome, or use „Trimite manual”.',
      );
    }
    if (isWhatsAppDeliveryConfigured(env)) {
      void checkWhatsAppCloudConfig(env).then(printWhatsAppCloudConfigCheck);
    }
    if (env.NODE_ENV === 'development') {
      printApiLanBanner(env.API_PORT);
    }
  });
}

void startServer().catch((error: unknown) => {
  console.error('[api] Failed to start server:', error instanceof Error ? error.message : error);
  process.exit(1);
});
