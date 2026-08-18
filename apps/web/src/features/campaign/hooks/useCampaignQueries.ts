import { useQuery } from '@tanstack/react-query';
import type { Campaign } from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['campaigns', 'active'],
    queryFn: async () => {
      const data = await apiClient.listCampaigns();
      return data.campaigns as Campaign[];
    },
  });
}

export function useDashboardStats(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'stats', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => apiClient.getDashboardStats(campaignId!),
    refetchInterval: 30000,
  });
}

export function useCampaignDetails(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', campaignId],
    enabled: Boolean(campaignId),
    queryFn: async () => {
      const data = await apiClient.getCampaign(campaignId!);
      return data.campaign as Campaign;
    },
  });
}
