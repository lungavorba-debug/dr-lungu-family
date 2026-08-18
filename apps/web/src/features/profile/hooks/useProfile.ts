import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UpdateUserProfileRequest } from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export function useMyProfile() {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: () => apiClient.getMyProfile(),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateUserProfileRequest) => apiClient.updateMyProfile(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });
}

export function useUnlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.unlockUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
