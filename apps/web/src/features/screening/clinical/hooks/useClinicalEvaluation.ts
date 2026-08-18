import { useMutation } from '@tanstack/react-query';

import type { ClinicalEvaluationRequest } from '@medscreen/types';

import { apiClient } from '../../../../shared/lib/api-client';



export function useEvaluateClinicalEngine() {

  return useMutation({

    mutationFn: (payload: ClinicalEvaluationRequest) => apiClient.evaluateClinicalEngine(payload),

  });

}


