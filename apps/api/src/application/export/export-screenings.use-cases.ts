import type { ExportScreeningsMetadataResponse } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type { CampaignRepository } from '../../domain/repositories/campaign.repository';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';
import { buildScreeningsExportXlsx } from './build-screenings-export-xlsx';
import { EXPORT_SCREENINGS_MAX_ROWS } from './export-screenings-shared';

export class GetExportScreeningsMetadataUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(campaignId: string): Promise<ExportScreeningsMetadataResponse> {
    const exportableCount = await this.screeningRepository.countCompleted({ campaignId });

    return {
      campaign_id: campaignId,
      exportable_count: exportableCount,
    };
  }
}

export class ExportScreeningsExcelUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly campaignRepository: CampaignRepository,
  ) {}

  async execute(params: {
    campaignId: string;
    from?: string;
    to?: string;
    campaignDay?: number;
  }) {
    let campaignStartDate: Date | undefined;

    if (params.campaignDay != null) {
      const campaign = await this.campaignRepository.findById(params.campaignId);
      if (!campaign) {
        throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
      }
      campaignStartDate = campaign.startDate;
    }

    const rows = await this.screeningRepository.listCompletedForExport({
      campaignId: params.campaignId,
      from: params.from ? new Date(params.from) : undefined,
      to: params.to ? new Date(params.to) : undefined,
      campaignDay: params.campaignDay,
      campaignStartDate,
    });

    if (rows.length === 0) {
      throw new AppError(
        404,
        'NOT_FOUND',
        'Nu există screeninguri finalizate de exportat pentru campania selectată.',
      );
    }

    if (rows.length > EXPORT_SCREENINGS_MAX_ROWS) {
      throw new AppError(
        413,
        'EXPORT_TOO_LARGE',
        `Exportul depășește limita de ${EXPORT_SCREENINGS_MAX_ROWS} înregistrări. Restrângeți intervalul de date.`,
      );
    }

    const xlsx = await buildScreeningsExportXlsx(rows);
    const date = new Date().toISOString().slice(0, 10);

    return {
      xlsx,
      rowCount: rows.length,
      filename: `medscreen-screeninguri-${date}.xlsx`,
    };
  }
}
