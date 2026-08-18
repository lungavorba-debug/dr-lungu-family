import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../shared/lib/api-client';

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function useDownloadScreeningPdf() {
  return useMutation({
    mutationFn: async (screeningId: string) => {
      const result = await apiClient.downloadScreeningPdf(screeningId);
      triggerBlobDownload(result.blob, result.filename);
      return result.filename;
    },
  });
}
