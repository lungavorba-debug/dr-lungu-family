import { useCallback, useEffect, useState } from 'react';
import type { AiAvailabilityResponse } from '@medscreen/types';
import { ApiClientError, apiClient } from '../../../../shared/lib/api-client';

export function useAiAvailability(options?: { refreshOnFocus?: boolean }) {
  const refreshOnFocus = options?.refreshOnFocus ?? true;

  const [availability, setAvailability] = useState<AiAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.getAiAvailability();
      setAvailability(result);
    } catch (refreshError) {
      setAvailability(null);
      if (refreshError instanceof ApiClientError) {
        setError(refreshError.message);
      } else {
        setError('Nu s-a putut verifica disponibilitatea AI.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!refreshOnFocus) {
      return;
    }

    const handleRefresh = () => {
      void refresh();
    };

    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleRefresh();
      }
    });

    return () => {
      window.removeEventListener('focus', handleRefresh);
    };
  }, [refresh, refreshOnFocus]);

  const voiceReady = Boolean(
    availability?.available && availability.transcription_supported,
  );

  return {
    availability,
    loading,
    error,
    voiceReady,
    aiUnavailable: !loading && !voiceReady,
    refresh,
  };
}
