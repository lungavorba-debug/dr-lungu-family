import type { MedicalMeasurements, PatientGender } from '@medscreen/types';
import type { ClinicSettingsSnapshot } from '@medscreen/types';
import type { ClinicalReportInput } from '../clinical-report-content.types';
import {
  resolveClinicSettingsSnapshot,
} from '../../clinic/resolve-clinic-settings';
import { formatMeasurementNote } from '../report-formatters';
import { formatParticipantCity } from '../format-participant-city';
import { resolveBrandingAssetUrl } from '../../clinic/branding-assets';
import type { MeasurementBadgeLevel } from '../../clinical/participant-view/build-measurement-rows';
import { buildPremiumMeasurementRows } from '../report-measurement-interpretation';
import { buildParticipantFindingLabels } from '../../clinical/participant-view/finding-labels';
import { buildCampaignEventDisplay } from '../campaign-display';
import { buildScreeningQuestionDisplayRows } from '../build-screening-question-display';
import { buildDynamicEvaluationSummary } from '../build-dynamic-evaluation-summary';
import { isEmptyMeasurementResult } from '../report-measurement-filter';
import {
  DEFAULT_FINDINGS_SECTION_TITLE,
  MEASUREMENT_COLUMN_PARAMETER,
  MEASUREMENT_COLUMN_RESULT,
  RECOMMENDATIONS_INTRO,
  REPORT_SCHEMA_VERSION,
} from '../participant-report.constants';
import {
  PARTICIPANT_GENDER_LABELS,
  REPORT_BLOOD_PRESSURE_EDUCATION_ITEMS,
  REPORT_BLOOD_PRESSURE_EDUCATION_TITLE,
  REPORT_CAMPAIGN_DISPLAY_NAME,
  REPORT_DISCLAIMER_BULLETS,
  REPORT_DISCLAIMER_FOOTER,
  REPORT_DISCLAIMER_INTRO,
  REPORT_DISCLAIMER_TITLE,
  REPORT_GLUCOSE_EDUCATION_ITEMS,
  REPORT_GLUCOSE_EDUCATION_TITLE,
  REPORT_GDPR_TEXT,
  REPORT_HEADER_CAMPAIGN_LABEL,
  REPORT_MEASUREMENT_COLUMN_INTERPRETATION,
  REPORT_PARTNER_LOCAL_SUPPORT_LABEL,
  REPORT_PARTNER_LOCAL_SUPPORT_NAME,
  REPORT_PARTNER_NATURALIS,
  REPORT_PARTNER_OFFICIAL_LABEL,
  REPORT_PARTNER_ORGANIZER_LABEL,
  REPORT_PARTNER_ORGANIZER_NAME,
  REPORT_PARTNERS_TITLE,
  REPORT_PROMO_BANNER_TEXT,
  REPORT_QR_LABEL,
  REPORT_QR_IMAGE_SRC,
  REPORT_QR_URL,
  REPORT_SECTION_CARDIOVASCULAR_RISK,
  REPORT_SECTION_GDPR,
  REPORT_SECTION_SCREENING_QUESTIONS,
  REPORT_SECTION_SIGNATURE,
} from '../participant-report-layout.constants';
import type {
  ParticipantReport,
  ReportEducationBlock,
  ReportFinding,
  ReportMeasurementRow,
  ReportMeasurementStatusLevel,
} from '../participant-report.schema';
import { buildPersonalizedParticipantRecommendations } from '../participant-recommendations';
import { buildMergedReportRecommendations } from '../report-merged-recommendations';
import { formatScreeningDateTime } from '../report-datetime';
import { getParticipantDisplayName } from '../report-personalization';
import { buildStableReportNumber, resolveOperatorDisplayName } from '../report-number';
import { buildReportSummaryLines } from '../report-summary';
import { buildScreeningObservations } from '../report-screening-observations';

export const REPORT_COMPOSER_VERSION = '1.1.0';

export type ComposeParticipantReportInput = ClinicalReportInput;

function mapBadgeLevelToStatusLevel(badgeLevel: MeasurementBadgeLevel): ReportMeasurementStatusLevel {
  if (badgeLevel === 'critical') return 'critical';
  if (badgeLevel === 'attention') return 'attention';
  if (badgeLevel === 'normal') return 'normal';
  return 'neutral';
}

function buildMeasurementRows(
  measurements: MedicalMeasurements,
  gender: PatientGender,
): ReportMeasurementRow[] {
  return buildPremiumMeasurementRows(measurements, gender)
    .filter((row) => !isEmptyMeasurementResult(row.result))
    .map((row) => ({
      parameter: row.parameter,
      result: row.result,
      reference_range: row.referenceRange,
      status_label: formatMeasurementNote(row.interpretation, row.badgeLevel, row.parameter),
      status_level: mapBadgeLevelToStatusLevel(row.badgeLevel),
    }));
}

function buildFindingItems(observations: string[]): ReportFinding[] {
  return buildParticipantFindingLabels(observations).map((label, index) => ({
    code: `finding_${index + 1}`,
    label,
  }));
}

function buildEducationBlocks(): ReportEducationBlock[] {
  return [
    {
      code: 'blood_pressure_measurement',
      title: REPORT_BLOOD_PRESSURE_EDUCATION_TITLE,
      items: [...REPORT_BLOOD_PRESSURE_EDUCATION_ITEMS],
    },
    {
      code: 'glucose_measurement',
      title: REPORT_GLUCOSE_EDUCATION_TITLE,
      items: [...REPORT_GLUCOSE_EDUCATION_ITEMS],
    },
  ];
}

function buildParticipantFilename(participantFullName: string, reportNumber: string): string {
  const safeName = participantFullName.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return `MedScreen-Raport-${safeName}-${reportNumber.replace(/[^\w-]/g, '')}.pdf`;
}

/** Assemble the canonical ParticipantReport from screening session input. */
export function composeParticipantReport(
  input: ComposeParticipantReportInput,
  clinicSettings?: ClinicSettingsSnapshot | null,
): ParticipantReport {
  const settings = resolveClinicSettingsSnapshot(clinicSettings);
  const participantDisplayName = getParticipantDisplayName(
    input.participant.gender,
    input.participant.first_name,
    input.participant.last_name,
  );
  const participantFullName = `${input.participant.first_name} ${input.participant.last_name}`;
  const { dateLine, timeLine } = formatScreeningDateTime(input.screeningDate);
  const campaignEvent = buildCampaignEventDisplay(input.campaign);
  const reportNumber = buildStableReportNumber(input.evaluation.screening_id, input.screeningDate);
  const operatorName = resolveOperatorDisplayName(input.operatorName);

  const screeningObservations = buildScreeningObservations({
    measurements: input.measurements,
    anamnesis: input.anamnesis,
    participant: { gender: input.participant.gender },
  });
  const findingItems = buildFindingItems(screeningObservations);
  const personalizedRecommendations = buildPersonalizedParticipantRecommendations({
    measurements: input.measurements,
    anamnesis: input.anamnesis,
    participant: { gender: input.participant.gender },
  });
  const recommendationItems = buildMergedReportRecommendations(personalizedRecommendations);
  const dynamicEvaluation = buildDynamicEvaluationSummary({
    measurements: input.measurements,
    anamnesis: input.anamnesis,
    gender: input.participant.gender,
  });

  return {
    schema_version: REPORT_SCHEMA_VERSION,
    metadata: {
      report_id: input.evaluation.screening_id,
      report_number: reportNumber,
      report_title: settings.pdf.report_title,
      screening_date: {
        iso: input.screeningDate,
        date_line: dateLine,
        time_line: timeLine,
      },
      generated_at: new Date().toISOString(),
      engine_version: input.evaluation.engine_version,
      rule_set_id: input.evaluation.rule_set_id,
      report_composer_version: REPORT_COMPOSER_VERSION,
      filename: buildParticipantFilename(participantFullName, reportNumber),
    },
    clinic: {
      name: settings.clinic.name,
      slogan: settings.clinic.slogan,
      phone: settings.contact.phone,
      address: settings.contact.address,
      website: settings.contact.website,
      email: settings.contact.email,
    },
    event: {
      festival_name: campaignEvent.title,
      edition: campaignEvent.editionLine,
      sponsor_name: campaignEvent.sponsorLine,
      work_point: REPORT_CAMPAIGN_DISPLAY_NAME,
    },
    participant: {
      display_name: participantDisplayName,
      first_name: input.participant.first_name,
      last_name: input.participant.last_name,
      age: input.participant.age,
      gender: input.participant.gender,
      gender_label: PARTICIPANT_GENDER_LABELS[input.participant.gender],
      phone: input.participant.phone?.trim() || null,
      city: formatParticipantCity(input.participant.city),
    },
    summary: {
      lines: buildReportSummaryLines(findingItems.length > 0),
    },
    measurements: {
      rows: buildMeasurementRows(input.measurements, input.participant.gender),
      column_labels: {
        parameter: MEASUREMENT_COLUMN_PARAMETER,
        result: MEASUREMENT_COLUMN_RESULT,
        reference_range: '',
        observation: REPORT_MEASUREMENT_COLUMN_INTERPRETATION,
      },
    },
    findings: {
      section_title: DEFAULT_FINDINGS_SECTION_TITLE,
      items: findingItems,
    },
    recommendations: {
      intro: RECOMMENDATIONS_INTRO,
      items: recommendationItems,
    },
    education: buildEducationBlocks(),
    footer: {
      disclaimer_paragraphs: [...settings.footer.disclaimer_paragraphs],
      operator_name: settings.footer.show_operator_signature ? operatorName : '',
      clinic_name: settings.clinic.name,
    },
    layout: {
      screening_questions: buildScreeningQuestionDisplayRows(
        input.screening_display ?? input.anamnesis,
      ),
      cardiovascular_risk: {
        title: REPORT_SECTION_CARDIOVASCULAR_RISK,
        level_label: dynamicEvaluation.levelLabel,
        summary: dynamicEvaluation.summary,
      },
      copy: {
        gdpr_text: REPORT_GDPR_TEXT,
        disclaimer_title: REPORT_DISCLAIMER_TITLE,
        disclaimer_intro: REPORT_DISCLAIMER_INTRO,
        disclaimer_bullets: [...REPORT_DISCLAIMER_BULLETS],
        disclaimer_footer: REPORT_DISCLAIMER_FOOTER,
        blood_pressure_education_title: REPORT_BLOOD_PRESSURE_EDUCATION_TITLE,
        blood_pressure_education_items: [...REPORT_BLOOD_PRESSURE_EDUCATION_ITEMS],
        glucose_education_title: REPORT_GLUCOSE_EDUCATION_TITLE,
        glucose_education_items: [...REPORT_GLUCOSE_EDUCATION_ITEMS],
        partners_title: REPORT_PARTNERS_TITLE,
        partner_organizer_label: REPORT_PARTNER_ORGANIZER_LABEL,
        partner_organizer_name: REPORT_PARTNER_ORGANIZER_NAME,
        partner_local_support_label: REPORT_PARTNER_LOCAL_SUPPORT_LABEL,
        partner_local_support_name: REPORT_PARTNER_LOCAL_SUPPORT_NAME,
        partner_official_label: REPORT_PARTNER_OFFICIAL_LABEL,
        partner_naturalis: REPORT_PARTNER_NATURALIS,
        header_campaign_label: REPORT_HEADER_CAMPAIGN_LABEL,
        qr_label: REPORT_QR_LABEL,
        screening_questions_title: REPORT_SECTION_SCREENING_QUESTIONS,
        signature_section_title: REPORT_SECTION_SIGNATURE,
        gdpr_section_title: REPORT_SECTION_GDPR,
        promo_banner_text: REPORT_PROMO_BANNER_TEXT,
      },
      measurement_labels: {
        parameter: MEASUREMENT_COLUMN_PARAMETER,
        value: 'Valoare',
        interpretation: REPORT_MEASUREMENT_COLUMN_INTERPRETATION,
      },
    },
    branding: {
      branding_version: '1',
      logo: {
        asset_id: settings.logo.logo_path ?? 'clinic-logo',
        mime: resolveLogoMime(settings.logo.logo_mime),
      },
      colors: settings.pdf.colors,
      typography: settings.pdf.typography,
    },
    qr: {
      url: REPORT_QR_URL,
      image_src: resolveReportQrImageSrc(settings),
      algorithm_version: '2',
    },
  };
}

function resolveLogoMime(mime: string): 'image/jpeg' | 'image/svg+xml' {
  return mime === 'image/svg+xml' ? 'image/svg+xml' : 'image/jpeg';
}

function resolveReportQrImageSrc(settings: ClinicSettingsSnapshot): string {
  return resolveBrandingAssetUrl(settings.logo.report_qr_path) ?? REPORT_QR_IMAGE_SRC;
}

export function buildParticipantReportFilename(report: ParticipantReport): string {
  return report.metadata.filename;
}
