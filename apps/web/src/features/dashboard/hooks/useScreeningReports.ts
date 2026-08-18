import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

export function useScreeningReports(params: {
  campaignId: string | undefined;
  patientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [
      'screening-reports',
      params.campaignId,
      params.patientId,
      params.search,
      params.page,
      params.limit,
    ],
    queryFn: () =>
      apiClient.listScreeningReports({
        campaignId: params.campaignId!,
        patientId: params.patientId,
        search: params.search,
        page: params.page,
        limit: params.limit,
      }),
    enabled: Boolean(params.campaignId),
  });
}
