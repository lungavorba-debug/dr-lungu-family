import type { CampaignRepository } from '../../domain/repositories/campaign.repository';
import { mapCampaignToDto, isSelectableCampaign } from '../../domain/repositories/campaign.repository';

export class ListActiveCampaignsUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute() {
    const campaigns = await this.campaignRepository.findActiveCampaigns();
    return campaigns.map(mapCampaignToDto);
  }
}

export class GetCampaignUseCase {
  constructor(private readonly campaignRepository: CampaignRepository) {}

  async execute(id: string, options?: { admin?: boolean }) {
    const campaign = await this.campaignRepository.findById(id);
    if (!campaign) {
      return null;
    }

    if (!options?.admin && !isSelectableCampaign(campaign)) {
      return null;
    }

    return mapCampaignToDto(campaign);
  }
}

export {
  ActivateCampaignUseCase,
  ArchiveCampaignUseCase,
  CloseCampaignUseCase,
  CreateCampaignUseCase,
  DeleteCampaignUseCase,
  GetCampaignDashboardSummaryUseCase,
  ListCampaignsAdminUseCase,
  UpdateCampaignUseCase,
} from './campaign-admin.use-cases';
