import { z } from 'zod';

const jwtExpiresInSchema = z
  .string()
  .default('8h')
  .refine((value) => /^(\d+[smhdw]|\d+)$/.test(value), {
    message: 'JWT_EXPIRES_IN must be a valid duration (e.g. 8h, 30m, 3600).',
  });

export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    API_HOST: z.string().min(1).default('0.0.0.0'),
    DATABASE_URL: z.string().min(1).optional(),
    JWT_SECRET: z.string().min(32).optional(),
    JWT_EXPIRES_IN: jwtExpiresInSchema,
    CORS_ORIGIN: z.string().url().default('http://localhost:5173'),
    STORAGE_TYPE: z.enum(['local', 's3']).default('local'),
    STORAGE_LOCAL_PATH: z.string().min(1).default('./storage'),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    SMTP_SECURE: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
      .transform((value) => value === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    /** Legacy single-field sender. Prefer SMTP_FROM_NAME + SMTP_FROM_EMAIL. */
    SMTP_FROM: z.string().email().optional(),
    SMTP_FROM_NAME: z.string().min(1).optional(),
    SMTP_FROM_EMAIL: z.string().email().optional(),
    /** When true, delivery emails include the online report button and URL. */
    EMAIL_ONLINE_REPORT_ENABLED: z
      .union([z.literal('true'), z.literal('false')])
      .optional()
      .default('false')
      .transform((value) => value === 'true'),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
    WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().min(1).optional(),
    WHATSAPP_API_VERSION: z.string().min(1).default('v21.0'),
    WHATSAPP_VERIFY_TOKEN: z.string().min(1).optional(),
    WEB_APP_URL: z.string().url().optional(),
    /** When set, enables OpenAI voice/transcription without clinic DB AI settings. */
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).optional(),
    OPENAI_TRANSCRIPTION_MODEL: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (!env.JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET is required in production.',
          path: ['JWT_SECRET'],
        });
      }
      if (!env.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'DATABASE_URL is required in production.',
          path: ['DATABASE_URL'],
        });
      }
      if (!env.WEB_APP_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'WEB_APP_URL is required in production for password reset links.',
          path: ['WEB_APP_URL'],
        });
      }
    }
  });

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export function parseApiEnv(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  return apiEnvSchema.parse(env);
}

export function parseApiEnvOrThrow(env: NodeJS.ProcessEnv = process.env): ApiEnv {
  const parsed = parseApiEnv(env);

  if (parsed.NODE_ENV !== 'production' && !parsed.JWT_SECRET) {
    console.warn('[config] JWT_SECRET is not set. Authentication will fail until configured.');
  }

  if (parsed.NODE_ENV !== 'production' && !parsed.DATABASE_URL) {
    console.warn('[config] DATABASE_URL is not set. Database operations will fail until configured.');
  }

  return parsed;
}

export function resolveSmtpFromAddress(env: ApiEnv = parseApiEnv()): string {
  if (env.SMTP_FROM?.trim()) {
    return env.SMTP_FROM.trim();
  }

  const fromName = env.SMTP_FROM_NAME?.trim();
  const fromEmail = env.SMTP_FROM_EMAIL?.trim();

  if (fromName && fromEmail) {
    return `"${fromName}" <${fromEmail}>`;
  }

  return fromEmail ?? '';
}

/** True when no real SMTP host is configured (Ethereal/dev fallback allowed). */
export function shouldUseEtherealSmtp(env: ApiEnv = parseApiEnv()): boolean {
  return !env.SMTP_HOST?.trim();
}

export function isEmailDeliveryConfigured(env: ApiEnv = parseApiEnv()): boolean {
  return Boolean(env.SMTP_HOST?.trim() && resolveSmtpFromAddress(env));
}

/** Startup label: Gmail when SMTP_HOST is set, otherwise Ethereal dev fallback. */
export function resolveSmtpProviderLabel(env: ApiEnv = parseApiEnv()): string {
  return shouldUseEtherealSmtp(env) ? 'Ethereal (development)' : 'Gmail';
}

export interface EnvSmtpConfigStatus {
  fromName: string | null;
  fromEmail: string | null;
  user: string | null;
  passConfigured: boolean;
  fromAddress: string;
}

/** Non-secret SMTP env snapshot for startup verification logging. */
export function getEnvSmtpConfigStatus(env: ApiEnv = parseApiEnv()): EnvSmtpConfigStatus {
  return {
    fromName: env.SMTP_FROM_NAME?.trim() || null,
    fromEmail: env.SMTP_FROM_EMAIL?.trim() || null,
    user: env.SMTP_USER?.trim() || null,
    passConfigured: Boolean(env.SMTP_PASS?.trim()),
    fromAddress: resolveSmtpFromAddress(env),
  };
}

export function isEmailOnlineReportEnabled(env: ApiEnv = parseApiEnv()): boolean {
  return env.EMAIL_ONLINE_REPORT_ENABLED;
}

export function isWhatsAppDeliveryConfigured(env: ApiEnv = parseApiEnv()): boolean {
  return Boolean(env.WHATSAPP_PHONE_NUMBER_ID?.trim() && env.WHATSAPP_ACCESS_TOKEN?.trim());
}

export interface EnvWhatsAppConfigStatus {
  phoneNumberId: string | null;
  businessAccountId: string | null;
  apiVersion: string;
  accessTokenConfigured: boolean;
}

/** Non-secret WhatsApp env snapshot for startup verification logging. */
export function getEnvWhatsAppConfigStatus(env: ApiEnv = parseApiEnv()): EnvWhatsAppConfigStatus {
  return {
    phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID?.trim() || null,
    businessAccountId: env.WHATSAPP_BUSINESS_ACCOUNT_ID?.trim() || null,
    apiVersion: env.WHATSAPP_API_VERSION,
    accessTokenConfigured: Boolean(env.WHATSAPP_ACCESS_TOKEN?.trim()),
  };
}

export function resolveWhatsAppProviderLabel(env: ApiEnv = parseApiEnv()): string {
  return isWhatsAppDeliveryConfigured(env) ? 'WhatsApp Cloud API' : 'Not configured';
}

export function resolveWhatsAppWebhookCallbackUrl(
  env: ApiEnv = parseApiEnv(),
  publicBaseUrl?: string,
): string {
  const base =
    publicBaseUrl?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    `http://localhost:${env.API_PORT}`;
  return `${base.replace(/\/$/, '')}/api/webhooks/meta/whatsapp`;
}

export interface EnvOpenAiConfig {
  apiKey: string;
  model: string;
  transcriptionModel: string;
}

/** True when OpenAI voice/STT can run from environment variables alone. */
export function isOpenAiVoiceConfigured(env: ApiEnv = parseApiEnv()): boolean {
  return Boolean(env.OPENAI_API_KEY?.trim());
}

export function resolveEnvOpenAiConfig(env: ApiEnv = parseApiEnv()): EnvOpenAiConfig | null {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
    transcriptionModel: env.OPENAI_TRANSCRIPTION_MODEL?.trim() || 'whisper-1',
  };
}

export interface EnvOpenAiConfigStatus {
  model: string;
  transcriptionModel: string;
  apiKeyConfigured: boolean;
}

/** Non-secret OpenAI env snapshot for startup verification logging. */
export function getEnvOpenAiConfigStatus(env: ApiEnv = parseApiEnv()): EnvOpenAiConfigStatus {
  const resolved = resolveEnvOpenAiConfig(env);
  return {
    model: resolved?.model ?? 'gpt-4o-mini',
    transcriptionModel: resolved?.transcriptionModel ?? 'whisper-1',
    apiKeyConfigured: Boolean(resolved?.apiKey),
  };
}

export function resolveOpenAiProviderLabel(env: ApiEnv = parseApiEnv()): string {
  return isOpenAiVoiceConfigured(env) ? 'OpenAI (env)' : 'Not configured';
}
