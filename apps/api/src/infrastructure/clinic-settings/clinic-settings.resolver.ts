import {
  isEmailDeliveryConfigured,
  isWhatsAppDeliveryConfigured,
  parseApiEnv,
  resolveEnvOpenAiConfig,
  resolveSmtpFromAddress,
} from '@medscreen/config';
import type { AiSettings, ClinicSettingsRecord, SmtpSettings, WhatsAppSettings } from '@medscreen/types';
import {
  cloneDefaultClinicSettings,
  isRemoteAiProviderAvailable,
  mergeSecretField,
  resolveAiConfig,
  toClinicSettingsSnapshot,
} from '@medscreen/shared';
import type { ClinicSettingsRepository } from '../../domain/repositories/clinic-settings.repository';
import { mapDbRecordToSettings } from '../../domain/repositories/clinic-settings.repository';

const CACHE_TTL_MS = 30_000;

export class ClinicSettingsResolver {
  private cache: ClinicSettingsRecord | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly repository: ClinicSettingsRepository) {}

  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }

  async getSettings(): Promise<ClinicSettingsRecord> {
    const now = Date.now();
    if (this.cache && now < this.cacheExpiresAt) {
      return this.cache;
    }

    const record = await this.repository.get();
    const settings = record ? mapDbRecordToSettings(record) : cloneDefaultClinicSettings();
    this.cache = settings;
    this.cacheExpiresAt = now + CACHE_TTL_MS;
    return settings;
  }

  async getSnapshot() {
    return toClinicSettingsSnapshot(await this.getSettings());
  }

  async getSmtpSettings(): Promise<SmtpSettings | null> {
    const env = parseApiEnv();
    const envFrom = resolveSmtpFromAddress(env);

    // Production: env Gmail SMTP always wins when SMTP_HOST is configured.
    if (isEmailDeliveryConfigured(env)) {
      return {
        enabled: true,
        host: env.SMTP_HOST ?? '',
        port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587),
        secure: env.SMTP_SECURE ?? false,
        user: env.SMTP_USER ?? '',
        pass: env.SMTP_PASS ?? '',
        from: envFrom,
      };
    }

    // Development: Ethereal or other SMTP from clinic settings when SMTP_HOST is missing.
    const settings = await this.getSettings();
    if (settings.smtp.enabled && settings.smtp.host) {
      const from = settings.smtp.from?.trim() || envFrom;
      if (from) {
        return {
          ...settings.smtp,
          from,
        };
      }
    }

    return null;
  }

  async getWhatsAppSettings(): Promise<WhatsAppSettings | null> {
    const env = parseApiEnv();

    if (isWhatsAppDeliveryConfigured(env)) {
      return {
        enabled: true,
        phone_number_id: env.WHATSAPP_PHONE_NUMBER_ID ?? '',
        access_token: env.WHATSAPP_ACCESS_TOKEN ?? '',
        business_account_id: env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? '',
        api_version: env.WHATSAPP_API_VERSION,
      };
    }

    const settings = await this.getSettings();
    if (
      settings.whatsapp.enabled &&
      settings.whatsapp.phone_number_id &&
      settings.whatsapp.access_token
    ) {
      return settings.whatsapp;
    }

    return null;
  }

  async isEmailConfigured(): Promise<boolean> {
    const smtp = await this.getSmtpSettings();
    return Boolean(smtp?.enabled && smtp.host && smtp.from);
  }

  async isWhatsAppConfigured(): Promise<boolean> {
    const whatsapp = await this.getWhatsAppSettings();
    return Boolean(whatsapp?.enabled && whatsapp.phone_number_id && whatsapp.access_token);
  }

  async getAiSettings(): Promise<AiSettings> {
    const env = parseApiEnv();
    const envOpenAi = resolveEnvOpenAiConfig(env);
    if (envOpenAi) {
      return {
        enabled: true,
        provider: 'openai',
        model: envOpenAi.model,
        transcription_model: envOpenAi.transcriptionModel,
        api_key: envOpenAi.apiKey,
        api_base_url: null,
        deployment_name: null,
      };
    }

    const settings = await this.getSettings();
    return settings.ai;
  }

  async isAiConfigured(): Promise<boolean> {
    const config = resolveAiConfig(await this.getAiSettings());
    return isRemoteAiProviderAvailable(config);
  }

  async getResolvedAiConfig() {
    return resolveAiConfig(await this.getAiSettings());
  }

  mergeSectionSecrets(
    current: ClinicSettingsRecord,
    section: keyof ClinicSettingsRecord,
    incoming: ClinicSettingsRecord[keyof ClinicSettingsRecord],
  ): ClinicSettingsRecord[keyof ClinicSettingsRecord] {
    if (section === 'smtp') {
      const currentSmtp = current.smtp;
      const nextSmtp = incoming as ClinicSettingsRecord['smtp'];
      return {
        ...nextSmtp,
        pass: mergeSecretField(currentSmtp.pass, nextSmtp.pass),
      };
    }
    if (section === 'whatsapp') {
      const currentWhatsapp = current.whatsapp;
      const nextWhatsapp = incoming as ClinicSettingsRecord['whatsapp'];
      return {
        ...nextWhatsapp,
        access_token: mergeSecretField(currentWhatsapp.access_token, nextWhatsapp.access_token),
      };
    }
    if (section === 'ai') {
      const currentAi = current.ai;
      const nextAi = incoming as ClinicSettingsRecord['ai'];
      const legacyKey = (nextAi as { openai_api_key?: string }).openai_api_key;
      const incomingKey = nextAi.api_key || legacyKey || '';
      return {
        ...nextAi,
        api_key: mergeSecretField(currentAi.api_key, incomingKey),
      };
    }
    return incoming;
  }
}
