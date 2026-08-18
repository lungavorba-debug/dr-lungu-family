import type { ClinicalReportInput } from './clinical-report-content.types';
import { composeParticipantReport, buildParticipantReportFilename } from './composer/compose-participant-report';
import { containsEnglish } from './report-personalization';
import type { ParticipantReport } from './participant-report.schema';

export type { ClinicalReportInput } from './clinical-report-content.types';

export {
  composeParticipantReport,
  buildParticipantReportFilename,
  REPORT_COMPOSER_VERSION,
} from './composer';

/** @deprecated Legacy alias — use composeParticipantReport(). */
export function buildClinicalReportContent(input: ClinicalReportInput): ParticipantReport {
  return composeParticipantReport(input);
}

/** @deprecated Use buildParticipantReportFilename(). */
export function buildClinicalReportFilename(report: ParticipantReport): string {
  return buildParticipantReportFilename(report);
}

export function reportContentHasEnglish(report: ParticipantReport): boolean {
  const texts = [
    ...report.summary.lines,
    report.participant.display_name,
    ...report.findings.items.map((item) => item.label),
    ...report.recommendations.items.map((item) => item.text),
    ...report.footer.disclaimer_paragraphs,
    ...report.measurements.rows.flatMap((row) => [row.parameter, row.result, row.status_label]),
  ];

  return texts.some((text) => containsEnglish(text));
}

export function reportContentHasForbiddenSymbols(report: ParticipantReport): boolean {
  const texts = [
    ...report.summary.lines,
    ...report.findings.items.map((item) => item.label),
    ...report.recommendations.items.map((item) => item.text),
    ...report.measurements.rows.map((row) => row.reference_range),
  ];

  return texts.some((text) => text.includes('≥') || text.includes('≤'));
}
