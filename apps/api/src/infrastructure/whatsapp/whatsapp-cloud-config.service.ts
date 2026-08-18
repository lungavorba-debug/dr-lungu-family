import {
  getEnvWhatsAppConfigStatus,
  isWhatsAppDeliveryConfigured,
  parseApiEnv,
  type ApiEnv,
} from '@medscreen/config';

export interface WhatsAppCloudConfigCheck {
  configured: boolean;
  provider: 'WhatsApp Cloud API' | 'Not configured';
  phoneNumberId: string | null;
  businessAccountId: string | null;
  apiVersion: string;
  accessTokenConfigured: boolean;
  graphReachable: boolean;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  status: string | null;
  codeVerificationStatus: string | null;
  issues: string[];
  warnings: string[];
}

interface WhatsAppPhoneNumberGraphResponse {
  display_phone_number?: string;
  verified_name?: string;
  status?: string;
  code_verification_status?: string;
  error?: {
    message?: string;
    code?: number;
  };
}

export async function checkWhatsAppCloudConfig(env: ApiEnv = parseApiEnv()): Promise<WhatsAppCloudConfigCheck> {
  const snapshot = getEnvWhatsAppConfigStatus(env);
  const configured = isWhatsAppDeliveryConfigured(env);
  const result: WhatsAppCloudConfigCheck = {
    configured,
    provider: configured ? 'WhatsApp Cloud API' : 'Not configured',
    phoneNumberId: snapshot.phoneNumberId,
    businessAccountId: snapshot.businessAccountId,
    apiVersion: snapshot.apiVersion,
    accessTokenConfigured: snapshot.accessTokenConfigured,
    graphReachable: false,
    displayPhoneNumber: null,
    verifiedName: null,
    status: null,
    codeVerificationStatus: null,
    issues: [],
    warnings: [],
  };

  if (!configured) {
    result.issues.push(
      'WHATSAPP_PHONE_NUMBER_ID și WHATSAPP_ACCESS_TOKEN trebuie setate în apps/api/.env.',
    );
    return result;
  }

  if (!snapshot.businessAccountId) {
    result.warnings.push(
      'WHATSAPP_BUSINESS_ACCOUNT_ID lipsește (opțional, dar util pentru administrare în Meta).',
    );
  }

  try {
    const phoneNumberId = env.WHATSAPP_PHONE_NUMBER_ID!.trim();
    const accessToken = env.WHATSAPP_ACCESS_TOKEN!.trim();
    const apiVersion = env.WHATSAPP_API_VERSION;
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=display_phone_number,verified_name,status,code_verification_status`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    const body = (await response.json()) as WhatsAppPhoneNumberGraphResponse;

    if (!response.ok) {
      const metaMessage = body.error?.message ?? `HTTP ${response.status}`;
      result.issues.push(`Verificarea Graph API a eșuat: ${metaMessage}`);

      if (body.error?.code === 133010 || /account not registered/i.test(metaMessage)) {
        result.issues.push(
          'Numărul WhatsApp Business nu este înregistrat/activat în Cloud API (133010). Finalizează setup-ul în Meta App Dashboard.',
        );
      }

      if (body.error?.code === 190 || /access token/i.test(metaMessage)) {
        result.issues.push('WHATSAPP_ACCESS_TOKEN invalid sau expirat.');
      }

      return result;
    }

    result.graphReachable = true;
    result.displayPhoneNumber = body.display_phone_number ?? null;
    result.verifiedName = body.verified_name ?? null;
    result.status = body.status ?? null;
    result.codeVerificationStatus = body.code_verification_status ?? null;

    if (body.status && body.status !== 'CONNECTED') {
      result.issues.push(
        `Numărul WhatsApp are status „${body.status}”. Trebuie să fie CONNECTED pentru trimitere mesaje.`,
      );
    }

    if (body.code_verification_status && body.code_verification_status !== 'VERIFIED') {
      result.warnings.push(
        `Verificarea codului numărului: ${body.code_verification_status}. Confirmă numărul prin OTP/SMS în Meta dacă trimiterea returnează (#133010).`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    result.issues.push(`Nu s-a putut contacta Graph API: ${message}`);
  }

  return result;
}

export function printWhatsAppCloudConfigCheck(check: WhatsAppCloudConfigCheck): void {
  console.log('[whatsapp:config] Provider:', check.provider);

  if (!check.configured) {
    for (const issue of check.issues) {
      console.warn(`[whatsapp:config] ⚠ ${issue}`);
    }
    return;
  }

  console.log(`[whatsapp:config] Phone Number ID: ${check.phoneNumberId}`);
  console.log(`[whatsapp:config] Display number: ${check.displayPhoneNumber ?? '(unknown)'}`);
  console.log(`[whatsapp:config] Verified name: ${check.verifiedName ?? '(unknown)'}`);
  console.log(`[whatsapp:config] Status: ${check.status ?? '(unknown)'}`);
  console.log(`[whatsapp:config] Graph reachable: ${check.graphReachable ? 'yes' : 'no'}`);

  for (const warning of check.warnings) {
    console.warn(`[whatsapp:config] ⚠ ${warning}`);
  }

  for (const issue of check.issues) {
    console.warn(`[whatsapp:config] ✗ ${issue}`);
  }

  if (check.graphReachable && check.issues.length === 0) {
    console.log('[whatsapp:config] ✓ Credentials validate against Meta Graph API.');
    console.log(
      '[whatsapp:config] Dacă trimiterea eșuează cu (#133010), finalizează înregistrarea numărului în Meta → WhatsApp → API Setup.',
    );
  }
}
