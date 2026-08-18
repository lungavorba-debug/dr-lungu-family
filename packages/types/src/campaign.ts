export const CAMPAIGN_STATUSES = {
  UPCOMING: 'upcoming',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived',
} as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[keyof typeof CAMPAIGN_STATUSES];

export interface Campaign {
  id: string;
  name: string;
  work_point: string;
  location: string;
  edition: string | null;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  status: CampaignStatus;
  organizer: string | null;
  screening_type: string | null;
  notes: string | null;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  location: string;
  organizer?: string | null;
  screening_type?: string | null;
  notes?: string | null;
  edition?: string | null;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  location?: string;
  organizer?: string | null;
  screening_type?: string | null;
  notes?: string | null;
  edition?: string | null;
}

export interface ListCampaignsAdminResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

export interface CampaignDashboardSummary {
  active: Campaign[];
  upcoming: Campaign[];
  closed: Campaign[];
}

export interface CampaignAdminResponse {
  campaign: Campaign;
}

export interface DashboardTrendPoint {
  date: string;
  count: number;
}

export interface DashboardOperatorActivity {
  operator_id: string;
  operator_name: string;
  screenings_count: number;
}

export interface DashboardStats {
  screenings_today: number;
  screenings_today_by_operator: number;
  completed_screenings_total: number;
  completed_screenings_today: number;
  critical_cases_total: number;
  campaign_is_active: boolean;
  screenings_trend: DashboardTrendPoint[];
  operator_activity_today: DashboardOperatorActivity[];
}
