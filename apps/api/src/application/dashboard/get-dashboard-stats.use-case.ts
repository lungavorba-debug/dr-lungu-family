import type { CampaignRepository } from '../../domain/repositories/campaign.repository';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function startOfTomorrow(): Date {
  const start = startOfToday();
  start.setDate(start.getDate() + 1);
  return start;
}

function formatDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class GetDashboardStatsUseCase {
  constructor(
    private readonly campaignRepository: CampaignRepository,
    private readonly screeningRepository: ScreeningRepository,
  ) {}

  async execute(params: { campaignId: string; operatorId: string }) {
    const campaign = await this.campaignRepository.findById(params.campaignId);
    if (!campaign) {
      return null;
    }

    const todayStart = startOfToday();
    const todayEnd = startOfTomorrow();

    const [
      screeningsToday,
      screeningsTodayByOperator,
      completedTotal,
      completedToday,
      criticalCasesTotal,
      trendRows,
      operatorRows,
    ] = await Promise.all([
      this.campaignRepository.countScreeningsToday(params.campaignId),
      this.campaignRepository.countScreeningsToday(params.campaignId, params.operatorId),
      this.screeningRepository.countCompleted({ campaignId: params.campaignId }),
      this.screeningRepository.countCompleted({
        campaignId: params.campaignId,
        from: todayStart,
        to: todayEnd,
      }),
      this.campaignRepository.countCriticalCases(params.campaignId),
      this.campaignRepository.getScreeningTrend(params.campaignId, 7),
      this.campaignRepository.getOperatorActivityToday(params.campaignId),
    ]);

    const trendMap = new Map(trendRows.map((row) => [row.date, row.count]));
    const screeningsTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(todayStart);
      date.setDate(date.getDate() - (6 - index));
      const key = formatDateKey(date);
      return {
        date: key,
        count: trendMap.get(key) ?? 0,
      };
    });

    return {
      screenings_today: screeningsToday,
      screenings_today_by_operator: screeningsTodayByOperator,
      completed_screenings_total: completedTotal,
      completed_screenings_today: completedToday,
      critical_cases_total: criticalCasesTotal,
      campaign_is_active: campaign.status === 'active' && campaign.isActive,
      screenings_trend: screeningsTrend,
      operator_activity_today: operatorRows.map((row) => ({
        operator_id: row.operatorId,
        operator_name: `${row.operatorFirstName} ${row.operatorLastName}`.trim(),
        screenings_count: row.count,
      })),
    };
  }
}
