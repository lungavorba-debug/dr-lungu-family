import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useCampaign } from '../../campaign/context/CampaignContext';

interface DashboardCampaignGateProps {
  children: ReactNode;
}

export function DashboardCampaignGate({ children }: DashboardCampaignGateProps) {
  const { activeCampaign, isLoading } = useCampaign();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Se încarcă datele campaniei...
      </div>
    );
  }

  if (!activeCampaign) {
    return <Navigate to="/campaigns/select" replace />;
  }

  return <>{children}</>;
}
