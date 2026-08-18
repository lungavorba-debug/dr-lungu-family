import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Campaign } from '@medscreen/types';
import { CAMPAIGN_STATUSES } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { apiClient } from '../../../shared/lib/api-client';
import {
  clearStoredActiveCampaignId,
  getStoredActiveCampaignId,
  setStoredActiveCampaignId,
} from '../lib/campaign-storage';

interface CampaignContextValue {
  activeCampaign: Campaign | null;
  isLoading: boolean;
  setActiveCampaign: (campaign: Campaign) => void;
  clearActiveCampaign: () => void;
}

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined);

function isSelectableCampaign(campaign: Campaign): boolean {
  return campaign.status === CAMPAIGN_STATUSES.ACTIVE && campaign.is_active;
}

export function CampaignProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [activeCampaign, setActiveCampaignState] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setActiveCampaignState(null);
      setIsLoading(false);
      return;
    }

    const storedId = getStoredActiveCampaignId(user.id);
    const userId = user.id;
    let cancelled = false;

    async function loadCampaignContext() {
      if (storedId) {
        try {
          const { campaign } = await apiClient.getCampaign(storedId);
          if (!cancelled) {
            if (isSelectableCampaign(campaign)) {
              setActiveCampaignState(campaign);
            } else {
              clearStoredActiveCampaignId(userId);
              setActiveCampaignState(null);
            }
          }
        } catch {
          if (!cancelled) {
            clearStoredActiveCampaignId(userId);
            setActiveCampaignState(null);
          }
        } finally {
          if (!cancelled) {
            setIsLoading(false);
          }
        }
        return;
      }

      try {
        const { campaigns } = await apiClient.listCampaigns();
        if (cancelled) return;

        if (campaigns.length === 1) {
          setStoredActiveCampaignId(userId, campaigns[0].id);
          setActiveCampaignState(campaigns[0]);
        } else {
          setActiveCampaignState(null);
        }
      } catch {
        if (!cancelled) {
          setActiveCampaignState(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    setIsLoading(true);
    void loadCampaignContext();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const setActiveCampaign = useCallback(
    (campaign: Campaign) => {
      if (!user) return;
      setStoredActiveCampaignId(user.id, campaign.id);
      setActiveCampaignState(campaign);
    },
    [user],
  );

  const clearActiveCampaign = useCallback(() => {
    if (user) {
      clearStoredActiveCampaignId(user.id);
    }
    setActiveCampaignState(null);
  }, [user]);

  const value = useMemo(
    () => ({
      activeCampaign,
      isLoading,
      setActiveCampaign,
      clearActiveCampaign,
    }),
    [activeCampaign, isLoading, setActiveCampaign, clearActiveCampaign],
  );

  return <CampaignContext.Provider value={value}>{children}</CampaignContext.Provider>;
}

export function useCampaign(): CampaignContextValue {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return context;
}
