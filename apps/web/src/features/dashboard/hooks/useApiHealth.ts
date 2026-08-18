import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

export function useApiHealth() {
  return useQuery({
    queryKey: ['dashboard', 'health'],
    queryFn: () => apiClient.checkHealth(),
    refetchInterval: 30000,
  });
}
