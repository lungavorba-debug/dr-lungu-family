import type { ParticipantReport } from '@medscreen/shared';

import '../styles/report-print.css';

import {
  ClinicalReportCardiovascularRisk,
  ClinicalReportClinicHeader,
  ClinicalReportDisclaimer,
  ClinicalReportEducationBoxes,
  ClinicalReportFooterRow,
  ClinicalReportGdprSection,
  ClinicalReportMeasurementsAndRiskFactors,
  ClinicalReportParticipantSection,
  ClinicalReportRecommendations,
} from './ClinicalReportSections';

export interface ClinicalReportViewProps {
  report: ParticipantReport;
  participantSignatureDataUrl?: string | null;
  presentationMode?: 'screen' | 'print';
}

/** Presentation-only report view — used for rendering, print, and HTML export. */
export function ClinicalReportView({
  report,
  participantSignatureDataUrl,
  presentationMode = 'screen',
}: ClinicalReportViewProps) {
  const containerClass =
    presentationMode === 'print'
      ? 'w-full max-w-none space-y-2 bg-white px-0 py-0 font-serif text-[9.5pt] leading-snug text-slate-900'
      : 'mx-auto max-w-[210mm] space-y-5 bg-white px-5 py-8 font-serif text-slate-900 shadow-medical sm:px-7 sm:py-10 print:w-full print:max-w-none print:space-y-2 print:px-0 print:py-0 print:shadow-none print:text-[9.5pt]';

  return (
    <article
      id="clinical-report"
      className={containerClass}
      data-testid="clinical-report"
      data-presentation={presentationMode}
    >
      <div className="report-page-1 space-y-3 print:space-y-2.5" data-testid="report-first-page">
        <ClinicalReportClinicHeader report={report} />
        <ClinicalReportParticipantSection report={report} />
        <ClinicalReportCardiovascularRisk report={report} />
        <ClinicalReportMeasurementsAndRiskFactors report={report} />
      </div>
      <div className="report-page-2 space-y-3 print:space-y-2.5" data-testid="report-second-page">
        <ClinicalReportRecommendations
          intro={report.recommendations.intro}
          items={report.recommendations.items}
        />
        <ClinicalReportEducationBoxes report={report} />
        <ClinicalReportGdprSection report={report} />
        <ClinicalReportFooterRow report={report} signatureDataUrl={participantSignatureDataUrl} />
        <ClinicalReportDisclaimer report={report} />
      </div>
    </article>
  );
}
