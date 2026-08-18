import { Link, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { useStartNewScreening } from '../../screening/hooks/useStartNewScreening';
import { useDashboardStats, useCampaignDetails } from '../../campaign/hooks/useCampaignQueries';
import { useClinicSettings } from '../../settings/context/ClinicSettingsContext';
import { ROLE_LABELS } from '../../shell/config/navigation';
import { DashboardCard } from '../../shell/components/DashboardCard';
import { ConnectionStatusBadge } from '../../../shared/components/ConnectionStatusBadge';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { formatDashboardDate } from '../lib/format-dashboard-date';

interface QuickActionProps {
  to: string;
  title: string;
  subtitle: string;
  accent: 'primary' | 'accent' | 'slate' | 'amber';
  icon: ReactNode;
}

function QuickAction({ to, title, subtitle, accent, icon }: QuickActionProps) {
  const accentClasses = {
    primary: 'border-brand-primary/20 hover:border-brand-primary bg-white',
    accent: 'border-slate-200 hover:border-brand-accent bg-white',
    slate: 'border-slate-200 hover:border-slate-400 bg-white',
    amber: 'border-slate-200 hover:border-amber-400 bg-white',
  }[accent];

  const iconClasses = {
    primary: 'bg-brand-primary text-white',
    accent: 'bg-brand-accent/10 text-brand-accent',
    slate: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-50 text-amber-600',
  }[accent];

  return (
    <Link
      to={to}
      className={`group flex min-h-touch items-center gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${accentClasses}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl transition group-hover:scale-105 ${iconClasses}`}>
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </Link>
  );
}

function StatValue({
  loading,
  error,
  value,
}: {
  loading: boolean;
  error: boolean;
  value: number | string;
}) {
  if (loading) return <>...</>;
  if (error) return <>—</>;
  return <>{value}</>;
}

export function DashboardHomePage() {
  const { user } = useAuth();
  const { activeCampaign, isLoading: campaignLoading } = useCampaign();
  const { status, label, isOnline } = useConnectionStatus();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
    error: statsQueryError,
    refetch: refetchStats,
  } = useDashboardStats(activeCampaign?.id);
  const { data: campaignDetails } = useCampaignDetails(activeCampaign?.id);
  const startNewScreening = useStartNewScreening();
  const { settings: clinicSettings } = useClinicSettings();

  if (!campaignLoading && !activeCampaign) {
    return <Navigate to="/campaigns/select" replace />;
  }

  if (campaignLoading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Se încarcă dashboard-ul...
      </div>
    );
  }

  const operatorName = user ? `${user.firstName} ${user.lastName}` : '—';
  const roleLabel = user ? ROLE_LABELS[user.role] : '—';
  const campaignTitle = activeCampaign?.edition
    ? `${activeCampaign.name} — ${activeCampaign.edition}`
    : activeCampaign?.name ?? '—';
  const campaignPeriod =
    campaignDetails || activeCampaign
      ? `${formatDashboardDate(campaignDetails?.start_date ?? activeCampaign?.start_date)} – ${formatDashboardDate(campaignDetails?.end_date ?? activeCampaign?.end_date)}`
      : '';
  const campaignStatusLabel = statsLoading
    ? '...'
    : statsError
      ? '—'
      : stats?.campaign_is_active
        ? 'Activă'
        : 'Inactivă';

  const screeningsSubtitle = statsLoading
    ? 'Se încarcă...'
    : statsError
      ? statsQueryError instanceof Error
        ? statsQueryError.message
        : 'Statistici indisponibile'
      : `${stats?.screenings_today_by_operator ?? 0} efectuate de dvs.`;

  const maxTrend = Math.max(...(stats?.screenings_trend.map((point) => point.count) ?? [1]), 1);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bun venit, {user?.firstName}!</h1>
          <p className="mt-1 text-sm text-slate-500">
            {clinicSettings?.clinic.name ?? 'Panou de control'} — {roleLabel}
          </p>
        </div>
        <Link
          to="/campaigns/select"
          className="inline-flex min-h-touch items-center justify-center rounded-xl border border-brand-primary/20 bg-white px-4 text-sm font-semibold text-brand-primary transition hover:bg-brand-primary/5"
        >
          Schimbă campania
        </Link>
      </div>

      <section aria-label="Acțiune principală">
        <button
          type="button"
          onClick={startNewScreening}
          className="flex min-h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-brand-primary text-lg font-semibold text-white shadow-medical transition hover:bg-brand-secondary"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Screening nou
        </button>
      </section>

      <section aria-label="Statistici panou">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Operator curent"
            value={operatorName}
            subtitle={roleLabel}
            accent="slate"
            icon={
              <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Conexiune</p>
            <div className="mt-3">
              <ConnectionStatusBadge status={status} label={label} />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {isOnline ? 'Sincronizare disponibilă' : 'Mod offline activ'}
            </p>
          </div>
          <div>
            <DashboardCard
              title="Screeninguri azi"
              value={
                <StatValue
                  loading={statsLoading}
                  error={statsError}
                  value={stats?.screenings_today ?? 0}
                />
              }
              subtitle={screeningsSubtitle}
              accent={statsError ? 'amber' : 'blue'}
              icon={
                <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            {statsError ? (
              <button
                type="button"
                onClick={() => refetchStats()}
                className="mt-2 text-xs font-medium text-brand-primary hover:underline"
              >
                Reîncearcă încărcarea statisticilor
              </button>
            ) : null}
          </div>
          <DashboardCard
            title="Campanie activă"
            value={campaignStatusLabel}
            subtitle={`${campaignTitle} · ${activeCampaign?.work_point ?? ''}${campaignPeriod ? ` · ${campaignPeriod}` : ''}`}
            accent={stats?.campaign_is_active === false ? 'amber' : 'green'}
            icon={
              <svg className="h-5 w-5 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            }
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <DashboardCard
            title="Screeninguri finalizate"
            value={
              <StatValue
                loading={statsLoading}
                error={statsError}
                value={stats?.completed_screenings_total ?? 0}
              />
            }
            subtitle={
              statsLoading
                ? 'Se încarcă...'
                : `${stats?.completed_screenings_today ?? 0} finalizate azi`
            }
            accent="blue"
            icon={
              <svg className="h-5 w-5 text-brand-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <DashboardCard
            title="Cazuri critice"
            value={
              <StatValue
                loading={statsLoading}
                error={statsError}
                value={stats?.critical_cases_total ?? 0}
              />
            }
            subtitle="Total campanie curentă"
            accent="amber"
            icon={
              <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            }
          />
        </div>
      </section>

      {!statsLoading && !statsError && stats ? (
        <section aria-label="Analiză campanie" className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Trend screening (7 zile)</h2>
            {stats.screenings_trend.every((point) => point.count === 0) ? (
              <p className="mt-4 text-sm text-slate-500">Nu există screeninguri în ultimele 7 zile.</p>
            ) : (
              <div className="mt-6 flex h-40 items-end gap-2">
                {stats.screenings_trend.map((point) => (
                  <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-md bg-brand-primary/80"
                      style={{ height: `${Math.max(8, (point.count / maxTrend) * 100)}%` }}
                      title={`${point.count} screeninguri`}
                    />
                    <span className="text-[10px] text-slate-500">{point.date.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Activitate operatori azi</h2>
            {stats.operator_activity_today.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nicio activitate înregistrată astăzi.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {stats.operator_activity_today.map((operator) => (
                  <li key={operator.operator_id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-800">{operator.operator_name}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {operator.screenings_count} screeninguri
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ) : null}

      <section aria-label="Acțiuni rapide">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Acțiuni rapide</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            to="/patients"
            title="Pacienți"
            subtitle="Caută sau înregistrează pacienți"
            accent="accent"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
          <QuickAction
            to="/reports"
            title="Rapoarte"
            subtitle="Previzualizare și partajare PDF"
            accent="amber"
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          {user?.role === 'ADMIN' ? (
            <QuickAction
              to="/settings"
              title="Setări"
              subtitle="Configurare sistem"
              accent="slate"
              icon={
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
          ) : null}
        </div>
      </section>
    </div>
  );
}
