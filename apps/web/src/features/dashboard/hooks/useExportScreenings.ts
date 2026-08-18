import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export interface ExportScreeningsParams {
  campaignId: string;
  from?: string;
  to?: string;
  campaignDay?: number;
}

export function useExportScreeningsMetadata(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['export-screenings-metadata', campaignId],
    queryFn: () => apiClient.getExportScreeningsMetadata(campaignId!),
    enabled: Boolean(campaignId),
  });
}

export function useExportScreeningsExcel() {
  return useMutation({
    mutationFn: async (params: ExportScreeningsParams) => {
      const result = await apiClient.downloadScreeningsExport(params.campaignId, {
        from: params.from,
        to: params.to,
        campaignDay: params.campaignDay,
      });
      triggerBlobDownload(result.blob, result.filename);
      return result;
    },
  });
}

/** @deprecated Use useExportScreeningsExcel */
export const useExportScreeningsCsv = useExportScreeningsExcel;
