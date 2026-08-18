import type { AdminUserListItem } from '@medscreen/types';
import { ROLE_LABELS } from '../../shell/config/navigation';
import { formatDashboardDate, formatDashboardDateTime } from '../lib/format-dashboard-date';

interface UsersTableProps {
  users: AdminUserListItem[];
  currentUserId?: string;
  pendingUserId?: string | null;
  onEdit: (user: AdminUserListItem) => void;
  onResetPassword: (user: AdminUserListItem) => void;
  onToggleActive: (user: AdminUserListItem) => void;
  onUnlock: (user: AdminUserListItem) => void;
  onDelete: (user: AdminUserListItem) => void;
}

export function UsersTable({
  users,
  currentUserId,
  pendingUserId,
  onEdit,
  onResetPassword,
  onToggleActive,
  onUnlock,
  onDelete,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
        Nu există utilizatori care să corespundă filtrelor selectate.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Utilizator</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Rol</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Creat</th>
              <th className="px-4 py-3 font-medium">Ultima autentificare</th>
              <th className="px-4 py-3 font-medium">Campanii</th>
              <th className="px-4 py-3 font-medium">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((user) => {
              const isSelf = user.id === currentUserId;
              const isPending = pendingUserId === user.id;

              const isLocked = Boolean(
                user.locked_until && new Date(user.locked_until).getTime() > Date.now(),
              );

              return (
                <tr key={user.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-4 font-semibold text-slate-900">
                    {user.first_name} {user.last_name}
                    {isSelf ? (
                      <span className="ml-2 rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-medium text-brand-primary">
                        Tu
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-slate-700">{user.email}</td>
                  <td className="px-4 py-4 text-slate-700">{ROLE_LABELS[user.role]}</td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {user.active ? 'Activ' : 'Inactiv'}
                      </span>
                      {isLocked ? (
                        <span className="inline-flex w-fit rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Blocat
                        </span>
                      ) : null}
                      {user.must_change_password ? (
                        <span className="inline-flex w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                          Parolă de schimbat
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{formatDashboardDate(user.created_at)}</td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatDashboardDateTime(user.last_login_at)}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {user.campaigns.length > 0 ? (
                      <ul className="space-y-1">
                        {user.campaigns.map((campaign) => (
                          <li key={campaign.id} className="text-xs">
                            {campaign.name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onEdit(user)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
                      >
                        Editează
                      </button>
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onResetPassword(user)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
                      >
                        Resetare parolă
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !isLocked}
                        onClick={() => onUnlock(user)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700 transition hover:border-brand-primary hover:text-brand-primary disabled:opacity-60"
                      >
                        Deblochează
                      </button>
                      <button
                        type="button"
                        disabled={isPending || isSelf}
                        onClick={() => onToggleActive(user)}
                        className={`inline-flex min-h-[36px] items-center rounded-lg px-3 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          user.active
                            ? 'bg-red-600 hover:bg-red-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {isPending
                          ? 'Se procesează...'
                          : user.active
                            ? 'Dezactivează'
                            : 'Activează'}
                      </button>
                      <button
                        type="button"
                        disabled={isPending || isSelf}
                        onClick={() => onDelete(user)}
                        className="inline-flex min-h-[36px] items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
                      >
                        Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
