import { useState, type FormEvent } from 'react';
import type { Campaign, CampaignStatus } from '@medscreen/types';
import { CAMPAIGN_STATUSES } from '@medscreen/types';
import { ApiClientError } from '../../../shared/lib/api-client';
import { ConfirmActionDialog } from '../../dashboard/components/ConfirmActionDialog';
import { DashboardPageHeader } from '../../dashboard/components/DashboardPageHeader';
import { CampaignFormDialog, type CampaignFormValues } from '../components/CampaignFormDialog';
import { useCampaign } from '../context/CampaignContext';
import {
  useActivateCampaign,
  useArchiveCampaign,
  useCampaignDashboardSummary,
  useCampaignsAdmin,
  useCloseCampaign,
  useCreateCampaign,
  useDeleteCampaign,
  useUpdateCampaign,
} from '../hooks/useCampaignAdmin';

type StatusFilter = CampaignStatus | 'all';

type PendingAction =
  | { type: 'activate'; campaign: Campaign }
  | { type: 'close'; campaign: Campaign }
  | { type: 'archive'; campaign: Campaign }
  | { type: 'delete'; campaign: Campaign };

const STATUS_LABELS: Record<CampaignStatus, string> = {
  upcoming: 'Programată',
  active: 'Activă',
  closed: 'Închisă',
  archived: 'Arhivată',
};

const STATUS_BADGE: Record<CampaignStatus, string> = {
  upcoming: 'bg-sky-100 text-sky-800',
  active: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-slate-100 text-slate-700',
  archived: 'bg-amber-100 text-amber-800',
};

function resolveMutationError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Operațiunea nu a putut fi finalizată.';
}

function toPayload(values: CampaignFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim() || null,
    start_date: values.start_date,
    end_date: values.end_date,
    location: values.location.trim(),
    organizer: values.organizer.trim() || null,
    screening_type: values.screening_type.trim() || null,
    notes: values.notes.trim() || null,
    edition: values.edition.trim() || null,
  };
}

function CampaignSummaryCard({
  title,
  campaigns,
  emptyLabel,
}: {
  title: string;
  campaigns: Campaign[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      {campaigns.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="font-medium text-slate-900">{campaign.name}</p>
              <p className="mt-1 text-xs text-slate-600">{campaign.location}</p>
              <p className="mt-2 text-xs text-slate-500">
                {campaign.start_date} — {campaign.end_date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showCloseActiveOption, setShowCloseActiveOption] = useState(false);

  const { activeCampaign, setActiveCampaign } = useCampaign();

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    refetch: refetchSummary,
  } = useCampaignDashboardSummary();

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useCampaignsAdmin({
    search: appliedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit,
  });

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign();
  const activateCampaign = useActivateCampaign();
  const closeCampaign = useCloseCampaign();
  const archiveCampaign = useArchiveCampaign();
  const deleteCampaign = useDeleteCampaign();

  const pendingCampaignId =
    updateCampaign.isPending && editCampaign
      ? editCampaign.id
      : activateCampaign.isPending && pendingAction?.type === 'activate'
        ? pendingAction.campaign.id
        : closeCampaign.isPending && pendingAction?.type === 'close'
          ? pendingAction.campaign.id
          : archiveCampaign.isPending && pendingAction?.type === 'archive'
            ? pendingAction.campaign.id
            : deleteCampaign.isPending && pendingAction?.type === 'delete'
              ? pendingAction.campaign.id
              : null;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim() || undefined);
  };

  const handleCreate = async (values: CampaignFormValues) => {
    setFormError(null);
    try {
      await createCampaign.mutateAsync(toPayload(values));
      setCreateOpen(false);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleEdit = async (values: CampaignFormValues) => {
    if (!editCampaign) return;

    setFormError(null);
    try {
      await updateCampaign.mutateAsync({
        id: editCampaign.id,
        payload: toPayload(values),
      });
      setEditCampaign(null);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleConfirmAction = async () => {
    if (!pendingAction) return;

    setActionError(null);
    setShowCloseActiveOption(false);
    try {
      if (pendingAction.type === 'activate') {
        await activateCampaign.mutateAsync(pendingAction.campaign.id);
      } else if (pendingAction.type === 'close') {
        await closeCampaign.mutateAsync(pendingAction.campaign.id);
      } else if (pendingAction.type === 'archive') {
        await archiveCampaign.mutateAsync(pendingAction.campaign.id);
      } else {
        await deleteCampaign.mutateAsync(pendingAction.campaign.id);
      }
      setPendingAction(null);
    } catch (mutationError) {
      if (
        pendingAction.type === 'activate' &&
        mutationError instanceof ApiClientError &&
        mutationError.errorCode === 'ACTIVE_CAMPAIGN_EXISTS' &&
        (summary?.active.length ?? 0) > 0
      ) {
        setShowCloseActiveOption(true);
      }
      setActionError(resolveMutationError(mutationError));
    }
  };

  const handleCloseActiveAndActivate = async () => {
    if (!pendingAction || pendingAction.type !== 'activate') return;

    const currentActive = summary?.active[0];
    if (!currentActive) return;

    setActionError(null);
    try {
      await closeCampaign.mutateAsync(currentActive.id);
      const { campaign: activated } = await activateCampaign.mutateAsync(pendingAction.campaign.id);

      if (activeCampaign?.id === currentActive.id) {
        setActiveCampaign(activated);
      }

      await refetchSummary();
      await refetch();
      setPendingAction(null);
      setShowCloseActiveOption(false);
    } catch (mutationError) {
      setActionError(resolveMutationError(mutationError));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / limit)) : 1;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Gestionare campanii"
        description="Creați, editați și controlați ciclul de viață al campaniilor de screening."
        actions={
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="min-h-touch rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary"
          >
            Campanie nouă
          </button>
        }
      />

      {summaryLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Se încarcă rezumatul campaniilor...
        </div>
      ) : null}

      {summaryError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm text-red-700">Nu s-a putut încărca rezumatul campaniilor.</p>
          <button
            type="button"
            onClick={() => refetchSummary()}
            className="mt-4 min-h-touch rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white"
          >
            Reîncearcă
          </button>
        </div>
      ) : null}

      {summary ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <CampaignSummaryCard
            title="Campanie activă"
            campaigns={summary.active}
            emptyLabel="Nicio campanie activă momentan."
          />
          <CampaignSummaryCard
            title="Campanii programate"
            campaigns={summary.upcoming}
            emptyLabel="Nicio campanie programată."
          />
          <CampaignSummaryCard
            title="Campanii închise recent"
            campaigns={summary.closed}
            emptyLabel="Nicio campanie închisă recent."
          />
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="campaign-search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Căutare
            </label>
            <input
              id="campaign-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nume, locație, organizator..."
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="campaign-status" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status
            </label>
            <select
              id="campaign-status"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2 sm:min-w-[180px]"
            >
              <option value="all">Toate</option>
              <option value={CAMPAIGN_STATUSES.UPCOMING}>Programate</option>
              <option value={CAMPAIGN_STATUSES.ACTIVE}>Active</option>
              <option value={CAMPAIGN_STATUSES.CLOSED}>Închise</option>
              <option value={CAMPAIGN_STATUSES.ARCHIVED}>Arhivate</option>
            </select>
          </div>
          <button
            type="submit"
            className="min-h-touch rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white"
          >
            Filtrează
          </button>
        </form>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Se încarcă campaniile...
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

      {data ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Campanie</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Perioadă</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Locație</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-600">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-600">Acțiuni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      Nu există campanii pentru filtrele selectate.
                    </td>
                  </tr>
                ) : (
                  data.campaigns.map((campaign) => (
                    <tr key={campaign.id} className={pendingCampaignId === campaign.id ? 'bg-brand-primary/5' : undefined}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-900">{campaign.name}</p>
                        {campaign.edition ? (
                          <p className="mt-1 text-xs text-slate-500">{campaign.edition}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {campaign.start_date}
                        <br />
                        {campaign.end_date}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{campaign.location}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE[campaign.status]}`}
                        >
                          {STATUS_LABELS[campaign.status]}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap justify-end gap-2">
                          {campaign.status !== CAMPAIGN_STATUSES.ARCHIVED ? (
                            <button
                              type="button"
                              onClick={() => {
                                setFormError(null);
                                setEditCampaign(campaign);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Editează
                            </button>
                          ) : null}
                          {campaign.status === CAMPAIGN_STATUSES.UPCOMING ||
                          campaign.status === CAMPAIGN_STATUSES.CLOSED ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPendingAction({ type: 'activate', campaign });
                              }}
                              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                            >
                              Activează
                            </button>
                          ) : null}
                          {campaign.status === CAMPAIGN_STATUSES.ACTIVE ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPendingAction({ type: 'close', campaign });
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Închide
                            </button>
                          ) : null}
                          {campaign.status === CAMPAIGN_STATUSES.CLOSED ||
                          campaign.status === CAMPAIGN_STATUSES.UPCOMING ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPendingAction({ type: 'archive', campaign });
                              }}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              Arhivează
                            </button>
                          ) : null}
                          {campaign.status !== CAMPAIGN_STATUSES.ACTIVE ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActionError(null);
                                setPendingAction({ type: 'delete', campaign });
                              }}
                              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
                            >
                              Șterge
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
            <span>
              {data.total} campanii {isFetching ? '· se actualizează...' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Înapoi
              </button>
              <span>
                Pagina {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-50"
              >
                Înainte
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <CampaignFormDialog
          mode="create"
          isPending={createCampaign.isPending}
          errorMessage={formError}
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {editCampaign ? (
        <CampaignFormDialog
          mode="edit"
          campaign={editCampaign}
          isPending={updateCampaign.isPending}
          errorMessage={formError}
          onSubmit={handleEdit}
          onClose={() => setEditCampaign(null)}
        />
      ) : null}

      {pendingAction ? (
        <ConfirmActionDialog
          title={
            pendingAction.type === 'activate'
              ? 'Activare campanie'
              : pendingAction.type === 'close'
                ? 'Închidere campanie'
                : pendingAction.type === 'archive'
                  ? 'Arhivare campanie'
                  : 'Ștergere campanie'
          }
          description={
            <>
              <p>
                {pendingAction.type === 'activate'
                  ? `Confirmați activarea campaniei „${pendingAction.campaign.name}”.`
                  : pendingAction.type === 'close'
                    ? `Confirmați închiderea campaniei „${pendingAction.campaign.name}”.`
                    : pendingAction.type === 'archive'
                      ? `Confirmați arhivarea campaniei „${pendingAction.campaign.name}”.`
                      : `Confirmați ștergerea definitivă a campaniei „${pendingAction.campaign.name}”.`}
              </p>
              {pendingAction.type === 'activate' ? (
                <p className="mt-2 text-amber-700">
                  Doar o campanie poate fi activă simultan.
                </p>
              ) : null}
              {pendingAction.type === 'activate' &&
              summary?.active[0] &&
              summary.active[0].id !== pendingAction.campaign.id ? (
                <div className="mt-4 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
                  <p className="text-sm text-slate-700">
                    Campania activă curentă:{' '}
                    <span className="font-semibold text-slate-900">{summary.active[0].name}</span>
                  </p>
                  <button
                    type="button"
                    disabled={closeCampaign.isPending || activateCampaign.isPending}
                    onClick={() => void handleCloseActiveAndActivate()}
                    className="mt-3 inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary px-4 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60"
                  >
                    {closeCampaign.isPending || activateCampaign.isPending
                      ? 'Se procesează...'
                      : 'Închide campania curentă'}
                  </button>
                </div>
              ) : null}
              {showCloseActiveOption &&
              pendingAction.type === 'activate' &&
              summary?.active[0] &&
              summary.active[0].id === pendingAction.campaign.id ? (
                <p className="mt-3 text-sm text-slate-600">Această campanie este deja activă.</p>
              ) : null}
              {pendingAction.type === 'delete' ? (
                <p className="mt-2 text-red-700">
                  Ștergerea este blocată dacă există screeninguri finalizate asociate campaniei.
                </p>
              ) : null}
              {actionError ? <p className="mt-3 text-red-700">{actionError}</p> : null}
            </>
          }
          confirmLabel={
            pendingAction.type === 'activate'
              ? 'Activează'
              : pendingAction.type === 'close'
                ? 'Închide'
                : pendingAction.type === 'archive'
                  ? 'Arhivează'
                  : 'Șterge'
          }
          confirmTone={pendingAction.type === 'delete' ? 'danger' : 'primary'}
          isPending={
            activateCampaign.isPending ||
            closeCampaign.isPending ||
            archiveCampaign.isPending ||
            deleteCampaign.isPending
          }
          onConfirm={handleConfirmAction}
          onCancel={() => {
            setPendingAction(null);
            setActionError(null);
            setShowCloseActiveOption(false);
          }}
        />
      ) : null}
    </div>
  );
}
