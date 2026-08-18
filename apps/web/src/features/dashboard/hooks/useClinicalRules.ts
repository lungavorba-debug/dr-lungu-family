import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ClinicalEvaluationRequest,
  CreateClinicalRuleRequest,
  UpdateClinicalRuleRequest,
} from '@medscreen/types';
import { apiClient } from '../../../shared/lib/api-client';

export interface ListClinicalRulesParams {
  search?: string;
  category?: string;
  enabled?: boolean;
  page?: number;
  limit?: number;
}

export function useClinicalRules(params: ListClinicalRulesParams) {
  return useQuery({
    queryKey: ['clinical-rules', params],
    queryFn: () => apiClient.listClinicalRules(params),
  });
}

export function useClinicalRuleHistory(params: { ruleId?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['clinical-rules-history', params],
    queryFn: () => apiClient.listClinicalRuleChanges(params),
  });
}

export function useCreateClinicalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateClinicalRuleRequest) => apiClient.createClinicalRule(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules'] });
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules-history'] });
    },
  });
}

export function useUpdateClinicalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ruleId, payload }: { ruleId: string; payload: UpdateClinicalRuleRequest }) =>
      apiClient.updateClinicalRule(ruleId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules'] });
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules-history'] });
    },
  });
}

export function useEnableClinicalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => apiClient.enableClinicalRule(ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules'] });
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules-history'] });
    },
  });
}

export function useDisableClinicalRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => apiClient.disableClinicalRule(ruleId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules'] });
      void queryClient.invalidateQueries({ queryKey: ['clinical-rules-history'] });
    },
  });
}

export function usePreviewClinicalEvaluation() {
  return useMutation({
    mutationFn: (payload: ClinicalEvaluationRequest) => apiClient.previewClinicalEvaluation(payload),
  });
}
