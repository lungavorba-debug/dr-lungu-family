export const CLINIC_SETTINGS_SECTIONS = {
  CLINIC: 'clinic',
  BRANDING: 'branding',
  CONTACT: 'contact',
  LOGO: 'logo',
  FOOTER: 'footer',
  PDF: 'pdf',
  QR: 'qr',
  SMTP: 'smtp',
  WHATSAPP: 'whatsapp',
  AI: 'ai',
  APPLICATION: 'application',
} as const;

export type ClinicSettingsSection =
  (typeof CLINIC_SETTINGS_SECTIONS)[keyof typeof CLINIC_SETTINGS_SECTIONS];

export interface ClinicInfoSettings {
  name: string;
  slogan: string;
  legal_name: string | null;
  description: string | null;
}

export interface BrandingSettings {
  app_name: string;
  app_subtitle: string;
  primary_color: string;
  accent_color: string;
  login_tagline: string;
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  website: string;
  google_business_url: string | null;
  contact_page_url: string | null;
}

export interface LogoSettings {
  logo_path: string | null;
  logo_mime: string;
  favicon_path: string | null;
  favicon_mime: string;
  sidebar_initials: string;
}

export type BrandingAssetKind = 'logo' | 'favicon';

export interface UploadBrandingAssetRequest {
  kind: BrandingAssetKind;
  file_base64: string;
  mime: string;
}

export interface UploadBrandingAssetResponse {
  logo: LogoSettings;
}

export interface FooterSettings {
  disclaimer_paragraphs: string[];
  show_operator_signature: boolean;
  footer_text: string | null;
}

export interface PdfBrandingColors {
  navy: string;
  green: string;
  ink: string;
  muted: string;
  rule_grey: string;
  badge_attention_bg: string;
  badge_normal_bg: string;
}

export interface PdfBrandingTypography {
  report_title_pt: number;
  section_title_pt: number;
  participant_name_pt: number;
  body_pt: number;
  table_header_pt: number;
  footer_pt: number;
  font_family: string;
}

export interface PdfSettings {
  report_title: string;
  colors: PdfBrandingColors;
  typography: PdfBrandingTypography;
  blood_pressure_education_title: string;
  blood_pressure_education_tips: string[];
}

export type QrPreferredUrl = 'website' | 'google_business' | 'contact_page' | 'custom';

export interface QrSettings {
  preferred_url: QrPreferredUrl;
  custom_url: string | null;
}

export interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

export interface WhatsAppSettings {
  enabled: boolean;
  phone_number_id: string;
  access_token: string;
  business_account_id: string;
  api_version: string;
}

export type AiProviderId = 'none' | 'openai' | 'gemini' | 'azure_openai';

/** @deprecated Use AiProviderId */
export type AiProvider = AiProviderId;

export interface AiSettings {
  enabled: boolean;
  provider: AiProviderId;
  model: string;
  transcription_model: string | null;
  api_key: string;
  api_base_url: string | null;
  deployment_name: string | null;
}

export interface ApplicationSettings {
  default_locale: string;
  support_email: string;
  session_timeout_hours: number;
  enable_offline_sync: boolean;
  delivery_signature: string;
}

export interface ClinicSettingsRecord {
  clinic: ClinicInfoSettings;
  branding: BrandingSettings;
  contact: ContactSettings;
  logo: LogoSettings;
  footer: FooterSettings;
  pdf: PdfSettings;
  qr: QrSettings;
  smtp: SmtpSettings;
  whatsapp: WhatsAppSettings;
  ai: AiSettings;
  application: ApplicationSettings;
}

export interface ClinicSettingsMeta {
  updated_at: string;
  updated_by_id: string | null;
  updated_by_name: string | null;
}

export interface PublicClinicSettings {
  clinic: ClinicInfoSettings;
  branding: BrandingSettings;
  contact: ContactSettings;
  logo: LogoSettings;
  footer: FooterSettings;
  pdf: PdfSettings;
  qr: QrSettings;
  application: Pick<ApplicationSettings, 'default_locale' | 'support_email' | 'delivery_signature'>;
}

export interface ClinicSettingsResponse extends ClinicSettingsRecord {
  meta: ClinicSettingsMeta;
}

export interface PublicClinicSettingsResponse {
  settings: PublicClinicSettings;
  meta: ClinicSettingsMeta;
}

export type UpdateClinicSettingsSectionRequest =
  | { section: 'clinic'; data: ClinicInfoSettings }
  | { section: 'branding'; data: BrandingSettings }
  | { section: 'contact'; data: ContactSettings }
  | { section: 'logo'; data: LogoSettings }
  | { section: 'footer'; data: FooterSettings }
  | { section: 'pdf'; data: PdfSettings }
  | { section: 'qr'; data: QrSettings }
  | { section: 'smtp'; data: SmtpSettings }
  | { section: 'whatsapp'; data: WhatsAppSettings }
  | { section: 'ai'; data: AiSettings }
  | { section: 'application'; data: ApplicationSettings };

export interface ClinicSettingsSnapshot {
  clinic: ClinicInfoSettings;
  contact: ContactSettings;
  footer: FooterSettings;
  pdf: PdfSettings;
  qr: QrSettings;
  logo: LogoSettings;
}
