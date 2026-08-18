import type { ParticipantReport } from './participant-report.schema';
import { BLOOD_PRESSURE_EDUCATION, CLINIC_BRANDING, CLINICAL_REPORT_DISCLAIMER } from './clinic-branding';
import type { PremiumMeasurementRow } from './report-measurement-interpretation';

/** @deprecated Legacy PDF v1 shape — use ParticipantReport for new code. */
export interface ClinicalReportContent {
  participantDisplayName: string;
  participantFullName: string;
  reportTitle: string;
  summaryLines: string[];
  clinicHeader: typeof CLINIC_BRANDING;
  bloodPressureEducation: typeof BLOOD_PRESSURE_EDUCATION;
  showBloodPressureEducation: boolean;
  campaignEvent: {
    title: string;
    editionLine: string | null;
    sponsorLine: string | null;
  };
  screeningDateLine: string;
  screeningTimeLine: string;
  operatorDisplayName: string;
  reportNumber: string;
  qrUrl: string;
  qrMatrix: boolean[][];
  campaignName: string;
  workPoint: string;
  age: number;
  screeningId: string;
  measurementRows: PremiumMeasurementRow[];
  screeningObservations: string[];
  findingLabels: string[];
  recommendationsIntro: string;
  recommendationBullets: string[];
  disclaimer: typeof CLINICAL_REPORT_DISCLAIMER;
}

/** Adapt canonical report model for legacy PDF v1 renderer. */
export function toLegacyClinicalReportContent(report: ParticipantReport): ClinicalReportContent {
  const measurementRows: PremiumMeasurementRow[] = report.measurements.rows.map((row) => ({
    parameter: row.parameter,
    result: row.result,
    referenceRange: row.reference_range,
    interpretation: row.status_label,
    badgeLevel:
      row.status_level === 'critical' || row.status_level === 'attention'
        ? row.status_level === 'critical'
          ? 'critical'
          : 'attention'
        : row.status_level === 'normal'
          ? 'normal'
          : 'neutral',
  }));

  return {
    participantDisplayName: report.participant.display_name,
    participantFullName: report.participant.display_name,
    reportTitle: report.metadata.report_title,
    summaryLines: report.summary.lines,
    clinicHeader: CLINIC_BRANDING,
    bloodPressureEducation: BLOOD_PRESSURE_EDUCATION,
    showBloodPressureEducation: report.education.some(
      (block) => block.code === 'blood_pressure_measurement',
    ),
    campaignEvent: {
      title: report.event.festival_name,
      editionLine: report.event.edition,
      sponsorLine: report.event.sponsor_name,
    },
    screeningDateLine: report.metadata.screening_date.date_line,
    screeningTimeLine: report.metadata.screening_date.time_line,
    operatorDisplayName: report.footer.operator_name,
    reportNumber: report.metadata.report_number,
    qrUrl: report.qr.url,
    qrMatrix: report.qr.matrix ?? [],
    campaignName: report.event.festival_name,
    workPoint: report.event.work_point,
    age: report.participant.age,
    screeningId: report.metadata.report_id,
    measurementRows,
    screeningObservations: [],
    findingLabels: report.findings.items.map((item) => item.label),
    recommendationsIntro: report.recommendations.intro,
    recommendationBullets: report.recommendations.items.map((item) => item.text),
    disclaimer: CLINICAL_REPORT_DISCLAIMER,
  };
}
