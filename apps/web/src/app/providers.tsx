import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from '../features/auth/context/AuthContext';
import { SetupProvider } from '../features/auth/context/SetupContext';
import { CampaignProvider } from '../features/campaign/context/CampaignContext';
import { PatientProvider } from '../features/patients/context/PatientContext';
import { ScreeningSessionProvider } from '../features/screening/context/ScreeningSessionContext';
import { ConnectionStatusProvider } from '../shared/context/ConnectionStatusContext';
import { ClinicSettingsProvider } from '../features/settings/context/ClinicSettingsContext';
import { BrandingThemeApplier } from '../features/settings/components/BrandingThemeApplier';
import { SyncProvider } from '../features/sync/context/SyncContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConnectionStatusProvider>
        <ClinicSettingsProvider>
          <BrandingThemeApplier />
          <SetupProvider>
          <AuthProvider>
            <SyncProvider>
              <CampaignProvider>
                <PatientProvider>
                  <ScreeningSessionProvider>{children}</ScreeningSessionProvider>
                </PatientProvider>
              </CampaignProvider>
            </SyncProvider>
          </AuthProvider>
          </SetupProvider>
        </ClinicSettingsProvider>
      </ConnectionStatusProvider>
    </QueryClientProvider>
  );
}
