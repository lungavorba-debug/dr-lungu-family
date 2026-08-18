import { useState, type FormEvent } from 'react';
import type { AdminUserListItem, RoleName } from '@medscreen/types';
import { ROLES } from '@medscreen/types';
import { ApiClientError } from '../../../shared/lib/api-client';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLE_LABELS } from '../../shell/config/navigation';
import { ConfirmActionDialog } from '../components/ConfirmActionDialog';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { ResetPasswordDialog } from '../components/ResetPasswordDialog';
import { UserFormDialog, type UserFormValues } from '../components/UserFormDialog';
import { UsersTable } from '../components/UsersTable';
import {
  useActivateUser,
  useCreateUser,
  useDeactivateUser,
  useDeleteUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from '../hooks/useUsers';
import { useUnlockUser } from '../../profile/hooks/useProfile';

type ActiveFilter = 'all' | 'active' | 'inactive';

function resolveMutationError(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Operațiunea nu a putut fi finalizată.';
}

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<RoleName | 'all'>('all');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserListItem | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserListItem | null>(null);
  const [toggleUser, setToggleUser] = useState<AdminUserListItem | null>(null);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUserListItem | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useUsers({
    search: appliedSearch,
    role: roleFilter === 'all' ? undefined : roleFilter,
    active: activeFilter === 'all' ? undefined : activeFilter === 'active',
    page,
    limit,
  });

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetUserPassword();
  const unlockUser = useUnlockUser();
  const deleteUser = useDeleteUser();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const pendingUserId =
    updateUser.isPending && editUser
      ? editUser.id
      : unlockUser.isPending
        ? unlockUser.variables
        : deleteUser.isPending && deleteUserTarget
          ? deleteUserTarget.id
          : activateUser.isPending && toggleUser
        ? toggleUser.id
        : deactivateUser.isPending && toggleUser
          ? toggleUser.id
          : null;

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim() || undefined);
  };

  const handleCreate = async (values: UserFormValues) => {
    setFormError(null);
    try {
      await createUser.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password,
        role: values.role,
      });
      setCreateOpen(false);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleEdit = async (values: UserFormValues) => {
    if (!editUser) return;

    setFormError(null);
    try {
      await updateUser.mutateAsync({
        userId: editUser.id,
        payload: {
          first_name: values.first_name,
          last_name: values.last_name,
          email: values.email,
          role: values.role,
        },
      });
      setEditUser(null);
    } catch (mutationError) {
      setFormError(resolveMutationError(mutationError));
    }
  };

  const handleResetPassword = async (password: string) => {
    if (!resetUser) return;

    setResetError(null);
    try {
      await resetPassword.mutateAsync({
        userId: resetUser.id,
        payload: { password },
      });
      setResetUser(null);
    } catch (mutationError) {
      setResetError(resolveMutationError(mutationError));
    }
  };

  const handleConfirmToggle = async () => {
    if (!toggleUser) return;

    setToggleError(null);
    try {
      if (toggleUser.active) {
        await deactivateUser.mutateAsync(toggleUser.id);
      } else {
        await activateUser.mutateAsync(toggleUser.id);
      }
      setToggleUser(null);
    } catch (mutationError) {
      setToggleError(resolveMutationError(mutationError));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteUserTarget) return;

    setDeleteError(null);
    try {
      await deleteUser.mutateAsync(deleteUserTarget.id);
      setDeleteUserTarget(null);
    } catch (mutationError) {
      setDeleteError(resolveMutationError(mutationError));
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Utilizatori"
        description="Administrați conturile, rolurile și accesul utilizatorilor platformei."
        actions={
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setCreateOpen(true);
            }}
            className="inline-flex min-h-touch items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary"
          >
            Utilizator nou
          </button>
        }
      />

      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto]"
      >
        <div>
          <label htmlFor="user-search" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Căutare
          </label>
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nume sau email"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="user-role-filter" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Rol
          </label>
          <select
            id="user-role-filter"
            value={roleFilter}
            onChange={(event) => {
              setRoleFilter(event.target.value as RoleName | 'all');
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate rolurile</option>
            <option value={ROLES.ADMIN}>{ROLE_LABELS.ADMIN}</option>
            <option value={ROLES.MEDIC}>{ROLE_LABELS.MEDIC}</option>
            <option value={ROLES.OPERATOR}>{ROLE_LABELS.OPERATOR}</option>
          </select>
        </div>

        <div>
          <label htmlFor="user-active-filter" className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            id="user-active-filter"
            value={activeFilter}
            onChange={(event) => {
              setActiveFilter(event.target.value as ActiveFilter);
              setPage(1);
            }}
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
          >
            <option value="all">Toate</option>
            <option value="active">Activi</option>
            <option value="inactive">Inactivi</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={isFetching}
            className="inline-flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:opacity-60"
          >
            {isFetching ? 'Se caută...' : 'Aplică'}
          </button>
        </div>
      </form>

      {isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error instanceof Error ? error.message : 'Lista utilizatorilor nu a putut fi încărcată.'}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-2 font-semibold text-red-800 underline"
          >
            Reîncearcă
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Se încarcă utilizatorii...
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <span>
              {data?.total ?? 0} utilizator{(data?.total ?? 0) === 1 ? '' : 'i'}
            </span>
            {appliedSearch || roleFilter !== 'all' || activeFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setAppliedSearch(undefined);
                  setRoleFilter('all');
                  setActiveFilter('all');
                  setPage(1);
                }}
                className="font-medium text-brand-primary hover:underline"
              >
                Resetează filtrele
              </button>
            ) : null}
          </div>

          <UsersTable
            users={data?.users ?? []}
            currentUserId={currentUser?.id}
            pendingUserId={pendingUserId}
            onEdit={(user) => {
              setFormError(null);
              setEditUser(user);
            }}
            onResetPassword={(user) => {
              setResetError(null);
              setResetUser(user);
            }}
            onToggleActive={(user) => {
              setToggleError(null);
              setToggleUser(user);
            }}
            onUnlock={(user) => {
              void unlockUser.mutateAsync(user.id);
            }}
            onDelete={(user) => {
              setDeleteError(null);
              setDeleteUserTarget(user);
            }}
          />

          {totalPages > 1 ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">
              <button
                type="button"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50"
              >
                Înapoi
              </button>
              <span className="text-slate-500">
                Pagina {page} din {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-700 disabled:opacity-50"
              >
                Înainte
              </button>
            </div>
          ) : null}
        </>
      )}

      {createOpen ? (
        <UserFormDialog
          mode="create"
          isPending={createUser.isPending}
          errorMessage={formError}
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      ) : null}

      {editUser ? (
        <UserFormDialog
          mode="edit"
          user={editUser}
          isPending={updateUser.isPending}
          errorMessage={formError}
          onSubmit={handleEdit}
          onClose={() => setEditUser(null)}
        />
      ) : null}

      {resetUser ? (
        <ResetPasswordDialog
          user={resetUser}
          isPending={resetPassword.isPending}
          errorMessage={resetError}
          onSubmit={handleResetPassword}
          onClose={() => setResetUser(null)}
        />
      ) : null}

      {toggleUser ? (
        <ConfirmActionDialog
          title={toggleUser.active ? 'Dezactivare utilizator' : 'Activare utilizator'}
          description={
            <>
              <p>
                {toggleUser.active
                  ? 'Utilizatorul nu va mai putea să se autentifice până la reactivare.'
                  : 'Utilizatorul va putea din nou să se autentifice în platformă.'}
              </p>
              <p className="mt-2 font-semibold text-slate-900">
                {toggleUser.first_name} {toggleUser.last_name} ({toggleUser.email})
              </p>
              {toggleError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  {toggleError}
                </p>
              ) : null}
            </>
          }
          confirmLabel={toggleUser.active ? 'Dezactivează' : 'Activează'}
          confirmTone={toggleUser.active ? 'danger' : 'primary'}
          isPending={activateUser.isPending || deactivateUser.isPending}
          onConfirm={() => void handleConfirmToggle()}
          onCancel={() => setToggleUser(null)}
        />
      ) : null}

      {deleteUserTarget ? (
        <ConfirmActionDialog
          title="Ștergere utilizator"
          description={
            <>
              <p>Această acțiune este permanentă. Utilizatorul va fi eliminat din sistem.</p>
              <p className="mt-2 font-semibold text-slate-900">
                {deleteUserTarget.first_name} {deleteUserTarget.last_name} ({deleteUserTarget.email})
              </p>
              {deleteError ? (
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  {deleteError}
                </p>
              ) : null}
            </>
          }
          confirmLabel="Șterge definitiv"
          confirmTone="danger"
          isPending={deleteUser.isPending}
          onConfirm={() => void handleConfirmDelete()}
          onCancel={() => setDeleteUserTarget(null)}
        />
      ) : null}
    </div>
  );
}
