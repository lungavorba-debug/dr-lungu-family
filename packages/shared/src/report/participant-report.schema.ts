import type { PatientGender } from '@medscreen/types';

import { REPORT_SCHEMA_VERSION } from './participant-report.constants';

export type ReportSchemaVersion = typeof REPORT_SCHEMA_VERSION;

/** Single source of truth for all participant-facing report outputs. */
export interface ParticipantReport {
  schema_version: ReportSchemaVersion;
  metadata: ReportMetadata;
  clinic: ReportClinicBlock;
  event: ReportEventBlock;
  participant: ReportParticipantBlock;
  summary: ReportSummaryBlock;
  measurements: ReportMeasurementsBlock;
  findings: ReportFindingsBlock;
  recommendations: ReportRecommendationsBlock;
  education: ReportEducationBlock[];
  footer: ReportFooterBlock;
  layout: ReportLayoutBlock;
  branding: ReportBrandingSnapshot;
  qr: ReportQrBlock;
}

export interface ReportScreeningDateTime {
  iso: string;
  date_line: string;
  time_line: string;
}

export interface ReportMetadata {
  report_id: string;
  report_number: string;
  report_title: string;
  screening_date: ReportScreeningDateTime;
  generated_at: string;
  engine_version: string;
  rule_set_id: string;
  report_composer_version: string;
  filename: string;
}

export interface ReportClinicBlock {
  name: string;
  slogan: string;
  phone: string;
  address: string;
  website: string;
  email?: string;
}

export interface ReportEventBlock {
  festival_name: string;
  edition: string | null;
  sponsor_name: string | null;
  work_point: string;
}

export interface ReportParticipantBlock {
  display_name: string;
  first_name: string;
  last_name: string;
  age: number;
  gender?: PatientGender;
  gender_label: string | null;
  phone: string | null;
  city: string | null;
}

export interface ReportScreeningQuestionRow {
  topic: string;
  answer: string;
}

export interface ReportCardiovascularRiskBlock {
  title: string;
  level_label: string;
  summary: string;
}

export interface ReportLayoutCopyBlock {
  gdpr_text: string;
  disclaimer_title: string;
  disclaimer_intro: string;
  disclaimer_bullets: string[];
  disclaimer_footer: string;
  blood_pressure_education_title: string;
  blood_pressure_education_items: string[];
  glucose_education_title: string;
  glucose_education_items: string[];
  partners_title: string;
  partner_organizer_label: string;
  partner_organizer_name: string;
  partner_local_support_label: string;
  partner_local_support_name: string;
  partner_official_label: string;
  partner_naturalis: string;
  header_campaign_label: string;
  qr_label: string;
  screening_questions_title: string;
  signature_section_title: string;
  gdpr_section_title: string;
  promo_banner_text: string;
}

export interface ReportLayoutMeasurementLabels {
  parameter: string;
  value: string;
  interpretation: string;
}

export interface ReportLayoutBlock {
  screening_questions: ReportScreeningQuestionRow[];
  cardiovascular_risk: ReportCardiovascularRiskBlock;
  copy: ReportLayoutCopyBlock;
  measurement_labels: ReportLayoutMeasurementLabels;
}

export interface ReportSummaryBlock {
  lines: string[];
}

export type ReportMeasurementStatusLevel = 'normal' | 'attention' | 'critical' | 'neutral';

export interface ReportMeasurementColumnLabels {
  parameter: string;
  result: string;
  reference_range: string;
  observation: string;
}

export interface ReportMeasurementRow {
  parameter: string;
  result: string;
  reference_range: string;
  status_label: string;
  status_level: ReportMeasurementStatusLevel;
}

export interface ReportMeasurementsBlock {
  rows: ReportMeasurementRow[];
  column_labels: ReportMeasurementColumnLabels;
}

export interface ReportFinding {
  code: string;
  label: string;
}

export interface ReportFindingsBlock {
  section_title: string;
  items: ReportFinding[];
}

export type ReportRecommendationPriority = 'routine' | 'soon' | 'urgent';

export interface ReportRecommendation {
  code: string;
  text: string;
  priority: ReportRecommendationPriority;
}

export interface ReportRecommendationsBlock {
  intro: string;
  items: ReportRecommendation[];
}

export interface ReportEducationBlock {
  code: string;
  title: string;
  items: string[];
}

export interface ReportFooterBlock {
  disclaimer_paragraphs: string[];
  operator_name: string;
  clinic_name: string;
}

export interface ReportLogoAsset {
  asset_id: string;
  mime: 'image/jpeg' | 'image/svg+xml';
}

export interface ReportColorTokens {
  navy: string;
  green: string;
  ink: string;
  muted: string;
  rule_grey: string;
  badge_attention_bg: string;
  badge_normal_bg: string;
}

export interface ReportTypographyTokens {
  report_title_pt: number;
  section_title_pt: number;
  participant_name_pt: number;
  body_pt: number;
  table_header_pt: number;
  footer_pt: number;
  font_family: string;
}

export interface ReportBrandingSnapshot {
  branding_version: string;
  logo: ReportLogoAsset;
  colors: ReportColorTokens;
  typography: ReportTypographyTokens;
}

export interface ReportQrBlock {
  url: string;
  /** Static image path for custom QR artwork (preferred over generated matrix). */
  image_src?: string;
  matrix?: boolean[][];
  algorithm_version: string;
}
