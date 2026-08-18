import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ClinicSettingsResponse, UpdateClinicSettingsSectionRequest } from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export function useAdminClinicSettings() {
  return useQuery({
    queryKey: ['clinic-settings', 'admin'],
    queryFn: () => apiClient.getClinicSettings(),
  });
}

export function useUpdateClinicSettingsSection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateClinicSettingsSectionRequest) =>
      apiClient.updateClinicSettingsSection(payload),
    onSuccess: (result: ClinicSettingsResponse) => {
      void queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
      queryClient.setQueryData(['clinic-settings', 'admin'], result);
    },
  });
}
