import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { useCampaign } from '../context/CampaignContext';
import { useActiveCampaigns } from '../hooks/useCampaignQueries';

export function CampaignSelectionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeCampaign, isLoading: campaignLoading, setActiveCampaign } = useCampaign();
  const { data: campaigns = [], isLoading, isError, error, refetch } = useActiveCampaigns();
  const [selectedId, setSelectedId] = useState<string | null>(activeCampaign?.id ?? null);

  useEffect(() => {
    if (activeCampaign) {
      setSelectedId(activeCampaign.id);
    }
  }, [activeCampaign]);

  useEffect(() => {
    if (isLoading || campaignLoading || isError || campaigns.length !== 1) {
      return;
    }

    const onlyCampaign = campaigns[0];
    setActiveCampaign(onlyCampaign);
    navigate('/', { replace: true });
  }, [campaigns, campaignLoading, isError, isLoading, navigate, setActiveCampaign]);

  if (!isLoading && !campaignLoading && campaigns.length === 1) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Se selectează campania activă...
      </div>
    );
  }

  function handleContinue() {
    const campaign = campaigns.find((item) => item.id === selectedId);
    if (!campaign) return;
    setActiveCampaign(campaign);
    navigate('/', { replace: true });
  }

  const operatorName = user ? `${user.firstName} ${user.lastName}` : '';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-brand-primary/15 bg-white p-6 shadow-medical">
        <p className="text-sm font-medium text-brand-primary">MedScreen Festival & Event Suite</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Selectează campania activă</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bun venit, {operatorName}. Alege campania și punctul de lucru pentru sesiunea curentă.
        </p>
      </div>

      {isLoading || campaignLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Se încarcă campaniile active...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'Nu s-au putut încărca campaniile.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 min-h-touch rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white"
          >
            Reîncearcă
          </button>
        </div>
      ) : null}

      {!isLoading && !isError ? (
        <>
          {campaigns.length === 0 ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
              <p className="font-medium text-amber-800">Nu există campanii active momentan.</p>
              <p className="mt-2 text-sm text-amber-700">
                Contactați administratorul pentru activarea unei campanii.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  selected={selectedId === campaign.id}
                  onSelect={() => setSelectedId(campaign.id)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            disabled={!selectedId || campaigns.length === 0}
            onClick={handleContinue}
            className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-brand-primary text-base font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continuă la panou
          </button>
        </>
      ) : null}
    </div>
  );
}

function CampaignCard({
  campaign,
  selected,
  onSelect,
}: {
  campaign: Campaign;
  selected: boolean;
  onSelect: () => void;
}) {
  const title = campaign.edition ? `${campaign.name} — ${campaign.edition}` : campaign.name;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-5 text-left transition ${
        selected
          ? 'border-brand-primary bg-brand-primary/5 shadow-medical ring-2 ring-brand-primary/30'
          : 'border-slate-200 bg-white hover:border-brand-primary/40 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-4">
        <span
          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-brand-primary bg-brand-primary' : 'border-slate-300 bg-white'
          }`}
          aria-hidden
        >
          {selected ? (
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-sm text-slate-600">{campaign.work_point}</p>
          {campaign.description ? (
            <p className="mt-2 text-sm text-slate-500">{campaign.description}</p>
          ) : null}
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-brand-primary">
            {campaign.start_date} — {campaign.end_date}
          </p>
        </div>
      </div>
    </button>
  );
}
