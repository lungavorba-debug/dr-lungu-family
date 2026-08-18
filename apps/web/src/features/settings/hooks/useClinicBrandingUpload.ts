import type { BrandingAssetKind } from '@medscreen/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

export function useUploadClinicBrandingAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { kind: BrandingAssetKind; file_base64: string; mime: string }) =>
      apiClient.uploadClinicBrandingAsset(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
  });
}
