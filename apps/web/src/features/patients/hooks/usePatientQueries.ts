import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreatePatientRequest, PatientWithHistory } from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export function useSearchPatientByPhone(phone: string | null) {
  return useQuery({
    queryKey: ['patients', 'search', 'phone', phone],
    enabled: Boolean(phone),
    queryFn: async () => {
      const data = await apiClient.searchPatients({ phone: phone! });
      return data.patients as PatientWithHistory[];
    },
    retry: false,
  });
}

export function useSearchPatients(params: { phone?: string; search?: string } | null) {
  return useQuery({
    queryKey: ['patients', 'search', params],
    enabled: Boolean(params && (params.phone || params.search)),
    queryFn: async () => {
      const data = await apiClient.searchPatients(params!);
      return data.patients as PatientWithHistory[];
    },
    retry: false,
  });
}

export function usePreviousMeasurements(patientId: string | undefined) {
  return useQuery({
    queryKey: ['patients', patientId, 'previous-measurements'],
    enabled: Boolean(patientId),
    queryFn: () => apiClient.getPreviousMeasurements(patientId!),
  });
}

export function useCreatePatient() {
  return useMutation({
    mutationFn: (payload: CreatePatientRequest) => apiClient.createPatient(payload),
  });
}

export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ['patients', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const data = await apiClient.getPatient(id!);
      return data.patient;
    },
  });
}
