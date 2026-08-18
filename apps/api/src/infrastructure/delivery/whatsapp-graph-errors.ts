export interface WhatsAppGraphErrorPayload {
  message?: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

export type WhatsAppCloudApiStage = 'config' | 'verify' | 'media_upload' | 'send_message';

export class WhatsAppCloudApiError extends Error {
  constructor(
    message: string,
    public readonly errorCode: string,
    public readonly hints: string[],
    public readonly metaErrorCode: number | null = null,
    public readonly metaErrorSubcode: number | null = null,
    public readonly fbtraceId?: string,
    public readonly stage?: WhatsAppCloudApiStage,
  ) {
    super(message);
    this.name = 'WhatsAppCloudApiError';
  }
}

interface WhatsAppErrorDefinition {
  errorCode: string;
  message: string;
  hints: string[];
}

const ERROR_DEFINITIONS: Record<number, WhatsAppErrorDefinition> = {
  133010: {
    errorCode: 'WHATSAPP_ACCOUNT_NOT_REGISTERED',
    message:
      'Numărul expeditorului nu are verificarea OTP finalizată în Meta Dashboard sau numărul destinatarului nu este adăugat la numerele de test.',
    hints: [
      'Meta for Developers → aplicația ta → WhatsApp → API Setup: finalizează verificarea OTP/SMS pentru numărul business (code_verification_status = VERIFIED, status = CONNECTED).',
      'În modul Development: secțiunea „Send messages to” / „To” → adaugă numărul destinatar (format +407xxxxxxxx).',
      'Confirmă WHATSAPP_PHONE_NUMBER_ID (Phone number ID, nu WABA ID) și WHATSAPP_ACCESS_TOKEN în apps/api/.env.',
      'Rulează npm run verify:whatsapp și GET /api/webhooks/meta/whatsapp/health pentru diagnostic.',
    ],
  },
  131030: {
    errorCode: 'WHATSAPP_RECIPIENT_NOT_ALLOWED',
    message:
      'Numărul destinatar nu este permis. În modul Development, doar numerele adăugate ca testeri pot primi mesaje.',
    hints: [
      'Meta App Dashboard → WhatsApp → API Setup → „To” (test phone numbers) → adaugă numărul destinatar.',
      'Folosește format internațional complet, ex: +407xxxxxxxx.',
      'După adăugare, reîncearcă trimiterea.',
    ],
  },
  131047: {
    errorCode: 'WHATSAPP_RE_ENGAGEMENT_REQUIRED',
    message:
      'Mesajul nu poate fi trimis — fereastra de 24h de conversație s-a închis. Pentru rapoarte proactive, folosește un template aprobat.',
    hints: [
      'Pentru trimitere document fără conversație activă, configurează un Message Template aprobat în Meta.',
      'Alternativ, solicită participantului să trimită un mesaj inițial către numărul business.',
    ],
  },
  190: {
    errorCode: 'WHATSAPP_ACCESS_TOKEN_INVALID',
    message: 'Token-ul de acces WhatsApp (WHATSAPP_ACCESS_TOKEN) este invalid sau expirat.',
    hints: [
      'Generează un token nou din Meta App Dashboard → WhatsApp → API Setup.',
      'Pentru producție, folosește un System User token permanent din Business Settings.',
      'Actualizează WHATSAPP_ACCESS_TOKEN în apps/api/.env și repornește API-ul.',
    ],
  },
  100: {
    errorCode: 'WHATSAPP_INVALID_PARAMETER',
    message: 'Parametru invalid în cererea către WhatsApp Cloud API.',
    hints: [
      'Verifică WHATSAPP_PHONE_NUMBER_ID și formatul numărului destinatar (E.164, fără +).',
      'Consultă logurile API pentru detaliile erorii Meta.',
    ],
  },
};

const TOKEN_ERROR_PATTERNS = [/access token/i, /OAuthException/i, /Session has expired/i];

export function parseWhatsAppGraphError(
  body: { error?: WhatsAppGraphErrorPayload },
  stage: WhatsAppCloudApiStage,
  fallbackMessage: string,
): WhatsAppCloudApiError {
  const graphError = body.error;
  const metaCode = graphError?.code ?? null;
  const metaSubcode = graphError?.error_subcode ?? null;
  const rawMessage = graphError?.message?.trim() || fallbackMessage;
  const fbtraceId = graphError?.fbtrace_id;

  if (metaCode !== null && ERROR_DEFINITIONS[metaCode]) {
    const definition = ERROR_DEFINITIONS[metaCode]!;
    return new WhatsAppCloudApiError(
      definition.message,
      definition.errorCode,
      definition.hints,
      metaCode,
      metaSubcode,
      fbtraceId,
      stage,
    );
  }

  if (TOKEN_ERROR_PATTERNS.some((pattern) => pattern.test(rawMessage))) {
    const definition = ERROR_DEFINITIONS[190]!;
    return new WhatsAppCloudApiError(
      definition.message,
      definition.errorCode,
      definition.hints,
      metaCode,
      metaSubcode,
      fbtraceId,
      stage,
    );
  }

  if (/account not registered/i.test(rawMessage) || /#133010/i.test(rawMessage)) {
    const definition = ERROR_DEFINITIONS[133010]!;
    return new WhatsAppCloudApiError(
      definition.message,
      definition.errorCode,
      definition.hints,
      133010,
      metaSubcode,
      fbtraceId,
      stage,
    );
  }

  return new WhatsAppCloudApiError(
    rawMessage,
    'WHATSAPP_API_ERROR',
    [
      'Verifică WHATSAPP_PHONE_NUMBER_ID și WHATSAPP_ACCESS_TOKEN în apps/api/.env.',
      'Rulează: npm run verify:whatsapp pentru diagnostic local.',
      fbtraceId ? `Trace Meta (fbtrace_id): ${fbtraceId}` : 'Consultă logurile API pentru fbtrace_id.',
    ],
    metaCode,
    metaSubcode,
    fbtraceId,
    stage,
  );
}

export function formatWhatsAppCloudApiErrorForUser(error: WhatsAppCloudApiError): string {
  if (error.errorCode === 'WHATSAPP_ACCOUNT_NOT_REGISTERED' || error.metaErrorCode === 133010) {
    const extraHints = error.hints.slice(0, 2).join(' ');
    return `${error.message} ${extraHints}`.trim();
  }

  if (error.hints.length === 0) {
    return error.message;
  }

  return `${error.message} ${error.hints[0]}`;
}

export function logWhatsAppGraphFailure(params: {
  stage: WhatsAppCloudApiStage;
  httpStatus: number;
  body: { error?: WhatsAppGraphErrorPayload };
  recipient?: string;
  phoneNumberId?: string;
}): void {
  const graphError = params.body.error;
  console.error('[whatsapp:cloud] Graph API request failed', {
    stage: params.stage,
    httpStatus: params.httpStatus,
    metaCode: graphError?.code ?? null,
    metaSubcode: graphError?.error_subcode ?? null,
    metaType: graphError?.type ?? null,
    message: graphError?.message ?? '(no message)',
    fbtraceId: graphError?.fbtrace_id ?? null,
    phoneNumberIdConfigured: Boolean(params.phoneNumberId),
    recipientMasked: params.recipient ? maskPhoneForLog(params.recipient) : undefined,
  });
}

function maskPhoneForLog(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return '****';
  return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
