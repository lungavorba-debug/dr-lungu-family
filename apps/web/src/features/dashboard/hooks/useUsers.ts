import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateUserRequest,
  ResetUserPasswordRequest,
  RoleName,
  UpdateUserRequest,
} from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export interface ListUsersParams {
  search?: string;
  role?: RoleName;
  active?: boolean;
  page?: number;
  limit?: number;
}

export function useUsers(params: ListUsersParams) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => apiClient.listUsers(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserRequest) => apiClient.createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpdateUserRequest }) =>
      apiClient.updateUser(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.activateUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.deactivateUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: ResetUserPasswordRequest }) =>
      apiClient.resetUserPassword(userId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
