import { useMutation, useQuery } from '@tanstack/react-query';
import type { SaveMeasurementsRequest } from '@medscreen/types';
import { apiClient } from '../../../../shared/lib/api-client';

export function usePreviousMeasurements(patientId: string | undefined) {
  return useQuery({
    queryKey: ['measurements', 'previous', patientId],
    enabled: Boolean(patientId),
    queryFn: async () => apiClient.getPreviousMeasurements(patientId!),
  });
}

export function useSaveMeasurements() {
  return useMutation({
    mutationFn: (payload: SaveMeasurementsRequest) => apiClient.saveMeasurements(payload),
  });
}
