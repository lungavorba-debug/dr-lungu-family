import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ClinicSettingsSnapshot, ClinicSettingsMeta, PublicClinicSettings } from '@medscreen/types';
import { toClinicSettingsSnapshot } from '@medscreen/shared';
import { apiClient } from '../../../shared/lib/api-client';

interface ClinicSettingsContextValue {
  settings: PublicClinicSettings | null;
  meta: ClinicSettingsMeta | null;
  snapshot: ClinicSettingsSnapshot | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const ClinicSettingsContext = createContext<ClinicSettingsContextValue | null>(null);

function buildSnapshot(settings: PublicClinicSettings): ClinicSettingsSnapshot {
  return toClinicSettingsSnapshot({
    clinic: settings.clinic,
    branding: settings.branding,
    contact: settings.contact,
    logo: settings.logo,
    footer: settings.footer,
    pdf: settings.pdf,
    qr: settings.qr,
    smtp: {
      enabled: false,
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: '',
      from: '',
    },
    whatsapp: {
      enabled: false,
      phone_number_id: '',
      access_token: '',
      business_account_id: '',
      api_version: 'v21.0',
    },
    ai: {
      enabled: false,
      provider: 'none',
      model: 'gpt-4o-mini',
      transcription_model: null,
      api_key: '',
      api_base_url: null,
      deployment_name: null,
    },
    application: {
      default_locale: settings.application.default_locale,
      support_email: settings.application.support_email,
      session_timeout_hours: 8,
      enable_offline_sync: true,
      delivery_signature: settings.application.delivery_signature,
    },
  });
}

export function ClinicSettingsProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clinic-settings', 'public'],
    queryFn: () => apiClient.getPublicClinicSettings(),
    staleTime: 60_000,
  });

  const value = useMemo<ClinicSettingsContextValue>(() => {
    const settings = data?.settings ?? null;
    return {
      settings,
      meta: data?.meta ?? null,
      snapshot: settings ? buildSnapshot(settings) : null,
      isLoading,
      isError,
      refetch: () => {
        void refetch();
      },
    };
  }, [data, isError, isLoading, refetch]);

  return <ClinicSettingsContext.Provider value={value}>{children}</ClinicSettingsContext.Provider>;
}

export function useClinicSettings() {
  const context = useContext(ClinicSettingsContext);
  if (!context) {
    throw new Error('useClinicSettings must be used within ClinicSettingsProvider');
  }
  return context;
}

export function useClinicSettingsSnapshot() {
  const { snapshot } = useClinicSettings();
  return snapshot;
}
