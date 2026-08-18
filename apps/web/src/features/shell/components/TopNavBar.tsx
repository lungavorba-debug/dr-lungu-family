import type { AuthUser } from '@medscreen/types';
import { ConnectionStatusBadge } from '../../../shared/components/ConnectionStatusBadge';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { UserProfileMenu } from './UserProfileMenu';

interface TopNavBarProps {
  user: AuthUser;
  onMenuToggle: () => void;
}

export function TopNavBar({ user, onMenuToggle }: TopNavBarProps) {
  const { status, label } = useConnectionStatus();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex min-h-touch min-w-touch items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          aria-label="Deschide meniul"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="lg:hidden">
          <p className="text-sm font-semibold text-slate-900">MedScreen</p>
          <p className="text-xs text-brand-accent">Festival Suite</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ConnectionStatusBadge status={status} label={label} compact />
        <UserProfileMenu user={user} />
      </div>
    </header>
  );
}
