import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/lib/api-client';

export function useScreeningDeliveries(screeningId: string | null | undefined) {
  return useQuery({
    queryKey: ['screening-deliveries', screeningId],
    queryFn: () => apiClient.listScreeningDeliveries(screeningId!),
    enabled: Boolean(screeningId),
  });
}
