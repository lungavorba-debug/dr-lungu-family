import type {
  CampaignDashboardSummary,
  CreateCampaignRequest,
  ListCampaignsAdminResponse,
  UpdateCampaignRequest,
} from '@medscreen/types';
import { CAMPAIGN_STATUSES } from '@medscreen/types';
import {
  mapCampaignToDto,
  type CampaignRepository,
} from '../../domain/repositories/campaign.repository';
import { AppError } from '../../lib/app-error';

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function assertEditableStatus(status: string): void {
  if (status === CAMPAIGN_STATUSES.ARCHIVED) {
    throw new AppError(400, 'INVALID_PARAMETER', 'Campaniile arhivate nu pot fi modificate.');
  }
}

export class GetCampaignDashboardSummaryUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(): Promise<CampaignDashboardSummary> {
    const [active, upcoming, closed] = await Promise.all([
      this.campaignRepository.findByStatus(CAMPAIGN_STATUSES.ACTIVE),
      this.campaignRepository.findByStatus(CAMPAIGN_STATUSES.UPCOMING),
      this.campaignRepository.findByStatus(CAMPAIGN_STATUSES.CLOSED),
    ]);

    return {
      active: active.map(mapCampaignToDto),
      upcoming: upcoming.map(mapCampaignToDto),
      closed: closed.slice(0, 10).map(mapCampaignToDto),
    };
  }
}

export class ListCampaignsAdminUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(params: {
    search?: string;
    status?: ListCampaignsAdminResponse['campaigns'][number]['status'];
    page: number;
    limit: number;
  }): Promise<ListCampaignsAdminResponse> {
    const skip = (params.page - 1) * params.limit;
    const result = await this.campaignRepository.list({
      search: params.search,
      status: params.status,
      skip,
      take: params.limit,
    });

    return {
      campaigns: result.items.map(mapCampaignToDto),
      total: result.total,
      page: params.page,
      limit: params.limit,
    };
  }
}

export class CreateCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(payload: CreateCampaignRequest) {
    const campaign = await this.campaignRepository.create({
      name: payload.name,
      workPoint: payload.location,
      edition: payload.edition ?? null,
      description: payload.description ?? null,
      startDate: parseDate(payload.start_date),
      endDate: parseDate(payload.end_date),
      organizer: payload.organizer ?? null,
      screeningType: payload.screening_type ?? null,
      notes: payload.notes ?? null,
    });

    return { campaign: mapCampaignToDto(campaign) };
  }
}

export class UpdateCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string, payload: UpdateCampaignRequest) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
    }

    assertEditableStatus(campaign.status);

    const startDate = payload.start_date ? parseDate(payload.start_date) : campaign.startDate;
    const endDate = payload.end_date ? parseDate(payload.end_date) : campaign.endDate;
    if (endDate < startDate) {
      throw new AppError(400, 'INVALID_PARAMETER', 'Data de încheiere trebuie să fie după data de început.', [
        { field: 'end_date', issue: 'Interval de date invalid.' },
      ]);
    }

    const updated = await this.campaignRepository.update(id, {
      name: payload.name,
      workPoint: payload.location,
      edition: payload.edition,
      description: payload.description,
      startDate: payload.start_date ? startDate : undefined,
      endDate: payload.end_date ? endDate : undefined,
      organizer: payload.organizer,
      screeningType: payload.screening_type,
      notes: payload.notes,
    });

    return { campaign: mapCampaignToDto(updated) };
  }
}

export class ActivateCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
    }

    if (campaign.status === CAMPAIGN_STATUSES.ACTIVE) {
      return { campaign: mapCampaignToDto(campaign) };
    }

    assertEditableStatus(campaign.status);

    const otherActive = await this.campaignRepository.findOtherActiveCampaign(id);
    if (otherActive) {
      throw new AppError(
        409,
        'ACTIVE_CAMPAIGN_EXISTS',
        `Există deja o campanie activă: ${otherActive.name}. Închideți campania curentă înainte de activarea alteia.`,
      );
    }

    const updated = await this.campaignRepository.setStatus(id, CAMPAIGN_STATUSES.ACTIVE, true);
    return { campaign: mapCampaignToDto(updated) };
  }
}

export class CloseCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
    }

    if (campaign.status === CAMPAIGN_STATUSES.CLOSED) {
      return { campaign: mapCampaignToDto(campaign) };
    }

    const updated = await this.campaignRepository.setStatus(id, CAMPAIGN_STATUSES.CLOSED, false);
    return { campaign: mapCampaignToDto(updated) };
  }
}

export class ArchiveCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
    }

    if (campaign.status === CAMPAIGN_STATUSES.ACTIVE) {
      throw new AppError(
        400,
        'INVALID_PARAMETER',
        'Nu puteți arhiva o campanie activă. Închideți campania mai întâi.',
      );
    }

    const updated = await this.campaignRepository.setStatus(id, CAMPAIGN_STATUSES.ARCHIVED, false);
    return { campaign: mapCampaignToDto(updated) };
  }
}

export class DeleteCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string): Promise<{ success: true }> {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      throw new AppError(404, 'NOT_FOUND', 'Campania nu a fost găsită.');
    }

    if (campaign.status === CAMPAIGN_STATUSES.ACTIVE) {
      throw new AppError(
        400,
        'INVALID_PARAMETER',
        'Nu puteți șterge o campanie activă. Închideți campania mai întâi.',
      );
    }

    const completedCount = await this.campaignRepository.countCompletedScreenings(id);
    if (completedCount > 0) {
      throw new AppError(
        409,
        'CAMPAIGN_HAS_SCREENINGS',
        `Campania conține ${completedCount} screeninguri finalizate și nu poate fi ștearsă.`,
      );
    }

    await this.campaignRepository.delete(id);
    return { success: true };
  }
}
