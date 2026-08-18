import { useMutation } from '@tanstack/react-query';
import type { CompleteScreeningRequest, CompleteScreeningResponse } from '@medscreen/types';
import { apiClient } from '../../../../shared/lib/api-client';

export function useCompleteScreening() {
  return useMutation<
    CompleteScreeningResponse,
    Error,
    { screeningId: string; payload: CompleteScreeningRequest }
  >({
    mutationFn: ({
      screeningId,
      payload,
    }: {
      screeningId: string;
      payload: CompleteScreeningRequest;
    }) => apiClient.completeScreening(screeningId, payload),
  });
}

export type { CompleteScreeningResponse };
