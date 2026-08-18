import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiClient } from '../../../shared/lib/api-client';

interface SetupContextValue {
  setupRequired: boolean | null;
  isLoading: boolean;
  refreshSetupStatus: () => Promise<void>;
}

const SetupContext = createContext<SetupContextValue | undefined>(undefined);

export function SetupProvider({ children }: { children: ReactNode }) {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSetupStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await apiClient.getSetupStatus();
      setSetupRequired(status.setup_required);
    } catch {
      setSetupRequired(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSetupStatus();
  }, [refreshSetupStatus]);

  const value = useMemo<SetupContextValue>(
    () => ({
      setupRequired,
      isLoading,
      refreshSetupStatus,
    }),
    [setupRequired, isLoading, refreshSetupStatus],
  );

  return <SetupContext.Provider value={value}>{children}</SetupContext.Provider>;
}

export function useSetup(): SetupContextValue {
  const context = useContext(SetupContext);
  if (!context) {
    throw new Error('useSetup must be used within SetupProvider');
  }
  return context;
}
