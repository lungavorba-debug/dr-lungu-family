import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
} from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export interface ListCampaignsAdminParams {
  search?: string;
  status?: Campaign['status'];
  page?: number;
  limit?: number;
}

export function useCampaignDashboardSummary() {
  return useQuery({
    queryKey: ['campaigns', 'admin', 'dashboard'],
    queryFn: () => apiClient.getCampaignDashboardSummary(),
  });
}

export function useCampaignsAdmin(params: ListCampaignsAdminParams) {
  return useQuery({
    queryKey: ['campaigns', 'admin', 'list', params],
    queryFn: () => apiClient.listCampaignsAdmin(params),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampaignRequest) => apiClient.createCampaign(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCampaignRequest }) =>
      apiClient.updateCampaign(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useActivateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.activateCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useCloseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.closeCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.archiveCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.deleteCampaign(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
