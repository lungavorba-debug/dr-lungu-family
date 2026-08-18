import type { ListScreeningReportsResponse } from '@medscreen/types';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';

export class ListScreeningReportsUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(params: {
    campaignId: string;
    patientId?: string;
    search?: string;
    from?: string;
    to?: string;
    page: number;
    limit: number;
  }): Promise<ListScreeningReportsResponse> {
    const skip = (params.page - 1) * params.limit;
    const result = await this.screeningRepository.listCompleted({
      campaignId: params.campaignId,
      patientId: params.patientId,
      search: params.search,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      skip,
      take: params.limit,
    });

    return {
      reports: result.items.map((item) => ({
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
        pdf_filename: item.pdfFilename,
        has_pdf: Boolean(item.pdfStoragePath && item.pdfFilename),
      })),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}
