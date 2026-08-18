import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

export function useCriticalCases(params: {
  campaignId: string | undefined;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['critical-cases', params.campaignId, params.page, params.limit],
    queryFn: () =>
      apiClient.listCriticalCases({
        campaignId: params.campaignId!,
        page: params.page,
        limit: params.limit,
      }),
    enabled: Boolean(params.campaignId),
  });
}
