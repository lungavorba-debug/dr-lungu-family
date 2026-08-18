import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../../shared/lib/api-client';

export function useDeliveryAvailability(screeningId: string | null | undefined) {
  return useQuery({
    queryKey: ['delivery-availability', screeningId],
    queryFn: () => apiClient.getDeliveryAvailability(screeningId!),
    enabled: Boolean(screeningId),
  });
}
