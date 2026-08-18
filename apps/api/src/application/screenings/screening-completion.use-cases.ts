import type { CompleteScreeningRequest } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';
import type { ScreeningPdfStorageService } from '../../infrastructure/storage/screening-pdf-storage.service';

export class CompleteScreeningUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly pdfStorage: ScreeningPdfStorageService,
  ) {}

  async execute(params: {
    screeningId: string;
    operatorId: string;
    payload: CompleteScreeningRequest;
  }) {
    const screening = await this.screeningRepository.findById(params.screeningId);
    if (!screening) {
      throw new AppError(404, 'NOT_FOUND', 'Screeningul solicitat nu a fost găsit.');
    }

    if (screening.operatorId !== params.operatorId) {
      throw new AppError(403, 'FORBIDDEN', 'Nu aveți permisiunea de a finaliza acest screening.');
    }

    if (params.payload.clinical_evaluation.screening_id !== params.screeningId) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Identificatorul screeningului nu corespunde.', [
        { field: 'clinical_evaluation.screening_id', issue: 'Trebuie să coincidă cu screeningId din URL.' },
      ]);
    }

    if (
      (params.payload.participant_report as { metadata: { report_id: string } }).metadata
        .report_id !== params.screeningId
    ) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Identificatorul raportului nu corespunde.', [
        { field: 'participant_report.metadata.report_id', issue: 'Trebuie să coincidă cu screeningId din URL.' },
      ]);
    }

    if (screening.status === 'completed' && screening.completedAt) {
      return {
        screening_id: screening.id,
        status: 'completed' as const,
        completed_at: screening.completedAt.toISOString(),
        pdf_filename: screening.pdfFilename ?? params.payload.pdf.filename,
        pdf_storage_path: screening.pdfStoragePath ?? '',
        already_completed: true,
      };
    }

    const pdfStoragePath = await this.pdfStorage.savePdf(
      params.screeningId,
      params.payload.pdf.base64,
    );

    const completedAt = new Date();
    const updated = await this.screeningRepository.completeScreening({
      screeningId: params.screeningId,
      payload: params.payload,
      pdfStoragePath,
      completedAt,
    });

    return {
      screening_id: updated.id,
      status: 'completed' as const,
      completed_at: updated.completedAt!.toISOString(),
      pdf_filename: updated.pdfFilename!,
      pdf_storage_path: updated.pdfStoragePath!,
      already_completed: false,
    };
  }
}

export class GetScreeningReportUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(screeningId: string) {
    const screening = await this.screeningRepository.findById(screeningId);
    if (!screening || screening.status !== 'completed' || !screening.participantReport) {
      throw new AppError(404, 'NOT_FOUND', 'Raportul screeningului nu a fost găsit.');
    }

    return {
      screening_id: screening.id,
      participant_report: screening.participantReport as Record<string, unknown>,
      completed_at: screening.completedAt!.toISOString(),
    };
  }
}

export class GetScreeningPdfUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly pdfStorage: ScreeningPdfStorageService,
  ) {}

  async execute(screeningId: string) {
    const screening = await this.screeningRepository.findById(screeningId);
    if (
      !screening ||
      screening.status !== 'completed' ||
      !screening.pdfStoragePath ||
      !screening.pdfFilename
    ) {
      throw new AppError(404, 'NOT_FOUND', 'PDF-ul screeningului nu a fost găsit.');
    }

    const bytes = await this.pdfStorage.readPdf(screening.pdfStoragePath);

    return {
      filename: screening.pdfFilename,
      mime_type: 'application/pdf' as const,
      bytes,
      metadata: {
        screening_id: screening.id,
        filename: screening.pdfFilename,
        mime_type: 'application/pdf' as const,
        byte_length: screening.pdfByteLength ?? bytes.byteLength,
        generator_version: screening.pdfGeneratorVersion ?? 0,
        generated_at: screening.pdfGeneratedAt?.toISOString() ?? screening.completedAt!.toISOString(),
        storage_path: screening.pdfStoragePath,
      },
    };
  }
}
