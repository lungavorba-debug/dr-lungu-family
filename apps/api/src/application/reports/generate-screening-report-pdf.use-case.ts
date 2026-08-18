import {
  PDF_GENERATOR_VERSION,
  buildParticipantReportFilename,
  pdfBytesToBase64,
  type GenerateParticipantReportPdfInput,
  type ParticipantReport,
} from '@medscreen/shared';

import { AppError } from '../../lib/app-error';
import type { HtmlReportPdfService } from '../../infrastructure/pdf/html-report-pdf.service';
import { normalizeParticipantSignatureDataUrl } from '../../infrastructure/pdf/normalize-participant-signature';

export interface GenerateScreeningReportPdfResult {
  screening_id: string;
  filename: string;
  mime_type: 'application/pdf';
  base64: string;
  generated_at: string;
  byte_length: number;
  generator_version: number;
}

function resolveWebAppUrl(): string {
  const configured = process.env.WEB_APP_URL?.trim() || process.env.CORS_ORIGIN?.trim();
  return configured || 'http://127.0.0.1:5173';
}

export class GenerateScreeningReportPdfUseCase {
  constructor(private readonly pdfService: HtmlReportPdfService) {}

  async execute(input: GenerateParticipantReportPdfInput): Promise<GenerateScreeningReportPdfResult> {
    const report = input.participant_report as unknown as ParticipantReport;
    const reportId = report?.metadata?.report_id;

    if (!reportId) {
      throw new AppError(400, 'INVALID_PARAMETER', 'participant_report.metadata.report_id lipsește.');
    }

    const signatureDataUrl = normalizeParticipantSignatureDataUrl(
      input.participant_signature_data_url,
    );

    try {
      const bytes = await this.pdfService.generatePdf({
        webAppUrl: resolveWebAppUrl(),
        report,
        participantSignatureDataUrl: signatureDataUrl,
      });

      return {
        screening_id: reportId,
        filename: buildParticipantReportFilename(report),
        mime_type: 'application/pdf',
        base64: pdfBytesToBase64(bytes),
        generated_at: new Date().toISOString(),
        byte_length: bytes.byteLength,
        generator_version: PDF_GENERATOR_VERSION,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      console.error('[pdf] GenerateScreeningReportPdfUseCase failed:', error);
      if (error instanceof Error && error.stack) {
        console.error(error.stack);
      }

      throw new AppError(
        502,
        'PDF_RENDER_FAILED',
        error instanceof Error ? error.message : 'Generarea PDF-ului participant a eșuat.',
      );
    }
  }
}
