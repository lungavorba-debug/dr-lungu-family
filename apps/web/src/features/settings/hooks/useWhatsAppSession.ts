import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

interface UseWhatsAppSessionOptions {
  enabled?: boolean;
  refetchIntervalMs?: number;
}

export function useWhatsAppSession(options: UseWhatsAppSessionOptions = {}) {
  const { enabled = true, refetchIntervalMs = 3000 } = options;

  return useQuery({
    queryKey: ['whatsapp-session'],
    queryFn: () => apiClient.getWhatsAppSession(),
    enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.connected) {
        return false;
      }
      return refetchIntervalMs;
    },
  });
}
