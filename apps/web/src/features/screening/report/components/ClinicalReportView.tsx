import type { ParticipantReport } from '@medscreen/shared';

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
      ? 'mx-auto max-w-[210mm] space-y-4 bg-white px-[10mm] py-[8mm] font-serif text-slate-900 print:max-w-none print:space-y-3 print:px-[9mm] print:py-[7mm] print:text-[9pt]'
      : 'mx-auto max-w-[210mm] space-y-5 bg-white px-5 py-8 font-serif text-slate-900 shadow-medical sm:px-7 sm:py-10';

  return (
    <article id="clinical-report" className={containerClass} data-testid="clinical-report">
      <div className="report-page-1 space-y-4 print:space-y-3" data-testid="report-first-page">
        <ClinicalReportClinicHeader report={report} />
        <ClinicalReportParticipantSection report={report} />
        <ClinicalReportCardiovascularRisk report={report} />
        <ClinicalReportMeasurementsAndRiskFactors report={report} />
      </div>
      <div className="report-page-2 space-y-4 print:space-y-3" data-testid="report-second-page">
        <ClinicalReportRecommendations
          intro={report.recommendations.intro}
          items={report.recommendations.items}
        />
        <ClinicalReportEducationBoxes report={report} />
        <ClinicalReportGdprSection report={report} />
        <ClinicalReportDisclaimer report={report} />
        <ClinicalReportFooterRow report={report} signatureDataUrl={participantSignatureDataUrl} />
      </div>
    </article>
  );
}
