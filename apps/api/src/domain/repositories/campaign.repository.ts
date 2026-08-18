import type { Campaign, CampaignStatus } from '@medscreen/types';
import { CAMPAIGN_STATUSES } from '@medscreen/types';

export interface CampaignRecord {
  id: string;
  name: string;
  workPoint: string;
  edition: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  status: CampaignStatus;
  organizer: string | null;
  screeningType: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignData {
  name: string;
  workPoint: string;
  edition?: string | null;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  organizer?: string | null;
  screeningType?: string | null;
  notes?: string | null;
}

export interface UpdateCampaignData {
  name?: string;
  workPoint?: string;
  edition?: string | null;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  organizer?: string | null;
  screeningType?: string | null;
  notes?: string | null;
}

export interface ListCampaignsParams {
  search?: string;
  status?: CampaignStatus;
  skip: number;
  take: number;
}

export interface CampaignRepository {
  findActiveCampaigns(): Promise<CampaignRecord[]>;
  findById(id: string): Promise<CampaignRecord | null>;
  findByStatus(status: CampaignStatus): Promise<CampaignRecord[]>;
  findOtherActiveCampaign(excludeId?: string): Promise<CampaignRecord | null>;
  list(params: ListCampaignsParams): Promise<{ items: CampaignRecord[]; total: number }>;
  create(data: CreateCampaignData): Promise<CampaignRecord>;
  update(id: string, data: UpdateCampaignData): Promise<CampaignRecord>;
  setStatus(id: string, status: CampaignStatus, isActive: boolean): Promise<CampaignRecord>;
  countCompletedScreenings(campaignId: string): Promise<number>;
  delete(id: string): Promise<void>;
  countScreeningsToday(campaignId: string, operatorId?: string): Promise<number>;
  countCriticalCases(campaignId: string): Promise<number>;
  getScreeningTrend(campaignId: string, days: number): Promise<Array<{ date: string; count: number }>>;
  getOperatorActivityToday(
    campaignId: string,
  ): Promise<Array<{ operatorId: string; operatorFirstName: string; operatorLastName: string; count: number }>>;
}

export function mapCampaignToDto(record: CampaignRecord): Campaign {
  return {
    id: record.id,
    name: record.name,
    work_point: record.workPoint,
    location: record.workPoint,
    edition: record.edition,
    description: record.description,
    start_date: record.startDate.toISOString().slice(0, 10),
    end_date: record.endDate.toISOString().slice(0, 10),
    is_active: record.isActive,
    status: record.status,
    organizer: record.organizer,
    screening_type: record.screeningType,
    notes: record.notes,
  };
}

export function isSelectableCampaign(record: CampaignRecord): boolean {
  return record.status === CAMPAIGN_STATUSES.ACTIVE && record.isActive;
}
