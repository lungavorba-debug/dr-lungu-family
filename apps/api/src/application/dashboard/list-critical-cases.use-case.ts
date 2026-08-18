import type { CriticalCaseWarning, ListCriticalCasesResponse } from '@medscreen/types';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';

function extractCriticalWarnings(clinicalEvaluation: unknown): CriticalCaseWarning[] {
  if (!clinicalEvaluation || typeof clinicalEvaluation !== 'object') return [];

  const warnings = (clinicalEvaluation as { warnings?: unknown }).warnings;
  if (!Array.isArray(warnings)) return [];

  return warnings
    .filter(
      (warning): warning is { code: string; message: string; severity: string } =>
        typeof warning === 'object' &&
        warning !== null &&
        typeof (warning as { code?: unknown }).code === 'string' &&
        typeof (warning as { message?: unknown }).message === 'string' &&
        (warning as { severity?: unknown }).severity === 'critical',
    )
    .map((warning) => ({
      code: warning.code,
      message: warning.message,
      severity: 'critical' as const,
    }));
}

export class ListCriticalCasesUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(params: {
    campaignId: string;
    page: number;
    limit: number;
  }): Promise<ListCriticalCasesResponse> {
    const skip = (params.page - 1) * params.limit;
    const result = await this.screeningRepository.listCritical({
      campaignId: params.campaignId,
      skip,
      take: params.limit,
    });

    return {
      cases: result.items.map((item) => ({
        screening_id: item.id,
        patient_id: item.patientId,
        patient_name:
          item.patientFirstName && item.patientLastName
            ? `${item.patientLastName} ${item.patientFirstName}`
            : null,
        patient_phone: item.patientPhone,
        operator_id: item.operatorId,
        operator_name: `${item.operatorFirstName} ${item.operatorLastName}`,
        completed_at: item.completedAt.toISOString(),
        critical_warnings: extractCriticalWarnings(item.clinicalEvaluation),
        has_pdf: Boolean(item.pdfStoragePath && item.pdfFilename),
      })),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}
