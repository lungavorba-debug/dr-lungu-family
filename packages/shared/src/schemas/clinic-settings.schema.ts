import { z } from 'zod';

const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Culoarea trebuie să fie în format hex (#RRGGBB).');

export const clinicInfoSettingsSchema = z.object({
  name: z.string().min(2).max(200),
  slogan: z.string().max(200),
  legal_name: z.string().max(200).nullable(),
  description: z.string().max(2000).nullable(),
});

export const brandingSettingsSchema = z.object({
  app_name: z.string().min(2).max(120),
  app_subtitle: z.string().max(120),
  primary_color: hexColorSchema,
  accent_color: hexColorSchema,
  login_tagline: z.string().max(200),
});

export const contactSettingsSchema = z.object({
  phone: z.string().min(3).max(40),
  email: z.string().email(),
  address: z.string().min(3).max(500),
  website: z.string().min(3).max(200),
  google_business_url: z.string().url().nullable(),
  contact_page_url: z.string().min(1).max(200).nullable(),
});

export const logoSettingsSchema = z.object({
  logo_path: z.string().max(500).nullable(),
  logo_mime: z.string().min(3).max(40),
  favicon_path: z.string().max(500).nullable(),
  favicon_mime: z.string().min(3).max(40),
  sidebar_initials: z.string().min(1).max(4),
});

const brandingAssetMimeSchema = z.string().min(3).max(40);

export const uploadBrandingAssetSchema = z.object({
  kind: z.enum(['logo', 'favicon']),
  file_base64: z.string().min(1),
  mime: brandingAssetMimeSchema,
});

export const footerSettingsSchema = z.object({
  disclaimer_paragraphs: z.array(z.string().min(1).max(1000)).min(1).max(10),
  show_operator_signature: z.boolean(),
  footer_text: z.string().max(500).nullable(),
});

export const pdfBrandingColorsSchema = z.object({
  navy: hexColorSchema,
  green: hexColorSchema,
  ink: hexColorSchema,
  muted: hexColorSchema,
  rule_grey: hexColorSchema,
  badge_attention_bg: hexColorSchema,
  badge_normal_bg: hexColorSchema,
});

export const pdfBrandingTypographySchema = z.object({
  report_title_pt: z.number().min(8).max(32),
  section_title_pt: z.number().min(6).max(24),
  participant_name_pt: z.number().min(8).max(24),
  body_pt: z.number().min(6).max(18),
  table_header_pt: z.number().min(6).max(16),
  footer_pt: z.number().min(6).max(14),
  font_family: z.string().min(2).max(80),
});

export const pdfSettingsSchema = z.object({
  report_title: z.string().min(3).max(200),
  colors: pdfBrandingColorsSchema,
  typography: pdfBrandingTypographySchema,
  blood_pressure_education_title: z.string().min(3).max(200),
  blood_pressure_education_tips: z.array(z.string().min(1).max(300)).min(1).max(10),
});

export const qrSettingsSchema = z.object({
  preferred_url: z.enum(['website', 'google_business', 'contact_page', 'custom']),
  custom_url: z.string().url().nullable(),
});

export const smtpSettingsSchema = z.object({
  enabled: z.boolean(),
  host: z.string().max(200),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  user: z.string().max(200),
  pass: z.string().max(500),
  from: z.string().email().or(z.literal('')),
});

export const whatsAppSettingsSchema = z.object({
  enabled: z.boolean(),
  phone_number_id: z.string().max(100),
  access_token: z.string().max(500),
  business_account_id: z.string().max(100).optional().default(''),
  api_version: z.string().min(2).max(20),
});

export const aiSettingsSchema = z
  .object({
    enabled: z.boolean(),
    provider: z.enum(['none', 'openai', 'gemini', 'azure_openai']),
    model: z.string().max(100),
    transcription_model: z.string().max(100).nullable().optional(),
    api_key: z.string().max(500).optional(),
    openai_api_key: z.string().max(500).optional(),
    api_base_url: z.string().url().nullable().optional(),
    deployment_name: z.string().max(120).nullable().optional(),
  })
  .transform((data) => ({
    enabled: data.enabled,
    provider: data.provider,
    model: data.model,
    transcription_model: data.transcription_model ?? null,
    api_key: data.api_key ?? data.openai_api_key ?? '',
    api_base_url: data.api_base_url ?? null,
    deployment_name: data.deployment_name ?? null,
  }));

export const applicationSettingsSchema = z.object({
  default_locale: z.string().min(2).max(10),
  support_email: z.string().email(),
  session_timeout_hours: z.number().int().min(1).max(168),
  enable_offline_sync: z.boolean(),
  delivery_signature: z.string().min(2).max(200),
});

export const clinicSettingsSectionSchemas = {
  clinic: clinicInfoSettingsSchema,
  branding: brandingSettingsSchema,
  contact: contactSettingsSchema,
  logo: logoSettingsSchema,
  footer: footerSettingsSchema,
  pdf: pdfSettingsSchema,
  qr: qrSettingsSchema,
  smtp: smtpSettingsSchema,
  whatsapp: whatsAppSettingsSchema,
  ai: aiSettingsSchema,
  application: applicationSettingsSchema,
} as const;

export const updateClinicSettingsSchema = z.discriminatedUnion('section', [
  z.object({ section: z.literal('clinic'), data: clinicInfoSettingsSchema }),
  z.object({ section: z.literal('branding'), data: brandingSettingsSchema }),
  z.object({ section: z.literal('contact'), data: contactSettingsSchema }),
  z.object({ section: z.literal('logo'), data: logoSettingsSchema }),
  z.object({ section: z.literal('footer'), data: footerSettingsSchema }),
  z.object({ section: z.literal('pdf'), data: pdfSettingsSchema }),
  z.object({ section: z.literal('qr'), data: qrSettingsSchema }),
  z.object({ section: z.literal('smtp'), data: smtpSettingsSchema }),
  z.object({ section: z.literal('whatsapp'), data: whatsAppSettingsSchema }),
  z.object({ section: z.literal('ai'), data: aiSettingsSchema }),
  z.object({ section: z.literal('application'), data: applicationSettingsSchema }),
]);

export type UpdateClinicSettingsInput = z.infer<typeof updateClinicSettingsSchema>;
