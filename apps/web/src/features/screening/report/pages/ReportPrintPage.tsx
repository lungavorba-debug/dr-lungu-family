import { useEffect, useState } from 'react';

import type { ParticipantReport } from '@medscreen/shared';

import { ClinicalReportView } from '../components/ClinicalReportView';
import '../styles/report-print.css';

export interface ReportPrintPayload {
  report: ParticipantReport;
  participantSignatureDataUrl?: string | null;
}

declare global {
  interface Window {
    __REPORT_PRINT_DATA__?: ReportPrintPayload;
  }
}

function applyReportBranding(report: ParticipantReport): void {
  const colors = report.branding?.colors;
  if (!colors) return;

  const root = document.documentElement;
  root.style.setProperty('--brand-primary', colors.navy ?? '#0f766e');
  root.style.setProperty('--brand-accent', colors.green ?? '#10b981');
  root.style.setProperty('--brand-secondary', colors.navy ?? '#0f766e');
}

/** Headless Chromium print target — HTML participant report is the single source of truth. */
export function ReportPrintPage() {
  const [payload] = useState<ReportPrintPayload | null>(() => window.__REPORT_PRINT_DATA__ ?? null);

  useEffect(() => {
    if (!payload) return;
    applyReportBranding(payload.report);
    document.body.classList.add('report-print-page');
    document.body.dataset.reportPrintReady = 'true';
  }, [payload]);

  if (!payload) {
    return (
      <div className="report-print-empty" data-testid="report-print-empty">
        Nu există date de raport pentru tipărire.
      </div>
    );
  }

  return (
    <ClinicalReportView
      report={payload.report}
      participantSignatureDataUrl={payload.participantSignatureDataUrl}
      presentationMode="print"
    />
  );
}
