import type { ClinicSettingsRecord } from '@medscreen/types';
import {
  BLOOD_PRESSURE_EDUCATION,
  CLINIC_BRANDING,
  CLINICAL_REPORT_DISCLAIMER,
} from '../report/clinic-branding';
import { REPORT_TITLE } from '../report/participant-report.constants';

export const DEFAULT_CLINIC_SETTINGS_ID = 'default';

export const DEFAULT_CLINIC_SETTINGS: ClinicSettingsRecord = {
  clinic: {
    name: CLINIC_BRANDING.name,
    slogan: CLINIC_BRANDING.slogan,
    legal_name: CLINIC_BRANDING.name,
    description: null,
  },
  branding: {
    app_name: 'MedScreen Festival',
    app_subtitle: 'Festival Suite',
    primary_color: '#003D5B',
    accent_color: '#38A649',
    login_tagline: 'Platformă de screening medical — evenimente și campanii',
  },
  contact: {
    phone: CLINIC_BRANDING.phone,
    email: CLINIC_BRANDING.email,
    address: CLINIC_BRANDING.address,
    website: CLINIC_BRANDING.website,
    google_business_url: CLINIC_BRANDING.googleBusinessUrl,
    contact_page_url: CLINIC_BRANDING.contactPageUrl,
  },
  logo: {
    logo_path: null,
    logo_mime: 'image/jpeg',
    favicon_path: null,
    favicon_mime: 'image/png',
    sidebar_initials: 'MS',
  },
  footer: {
    disclaimer_paragraphs: [...CLINICAL_REPORT_DISCLAIMER.paragraphs],
    show_operator_signature: true,
    footer_text: null,
  },
  pdf: {
    report_title: REPORT_TITLE,
    colors: {
      navy: '#003D5B',
      green: '#38A649',
      ink: '#252B30',
      muted: '#737880',
      rule_grey: '#E5E9EF',
      badge_attention_bg: '#FEF3E2',
      badge_normal_bg: '#EDF7F0',
    },
    typography: {
      report_title_pt: 17,
      section_title_pt: 10,
      participant_name_pt: 13,
      body_pt: 9.5,
      table_header_pt: 7.5,
      footer_pt: 7.5,
      font_family: 'Liberation Serif',
    },
    blood_pressure_education_title: BLOOD_PRESSURE_EDUCATION.title,
    blood_pressure_education_tips: [...BLOOD_PRESSURE_EDUCATION.tips],
  },
  qr: {
    preferred_url: 'website',
    custom_url: null,
  },
  smtp: {
    enabled: false,
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
  },
  whatsapp: {
    enabled: false,
    phone_number_id: '',
    access_token: '',
    business_account_id: '',
    api_version: 'v21.0',
  },
  ai: {
    enabled: false,
    provider: 'none',
    model: 'gpt-4o-mini',
    transcription_model: null,
    api_key: '',
    api_base_url: null,
    deployment_name: null,
  },
  application: {
    default_locale: 'ro',
    support_email: CLINIC_BRANDING.email,
    session_timeout_hours: 8,
    enable_offline_sync: true,
    delivery_signature: 'Echipa Dr. Lungu Family',
  },
};

export function cloneDefaultClinicSettings(): ClinicSettingsRecord {
  return JSON.parse(JSON.stringify(DEFAULT_CLINIC_SETTINGS)) as ClinicSettingsRecord;
}
