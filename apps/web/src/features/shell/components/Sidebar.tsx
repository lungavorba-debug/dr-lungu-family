import { Link, useLocation } from 'react-router-dom';
import { ConnectionStatusBadge } from '../../../shared/components/ConnectionStatusBadge';
import { useConnectionStatus } from '../../../shared/context/ConnectionStatusContext';
import { useCampaign } from '../../campaign/context/CampaignContext';
import { useStartNewScreening } from '../../screening/hooks/useStartNewScreening';
import { useClinicSettings } from '../../settings/context/ClinicSettingsContext';
import { ClinicBrandMark } from './ClinicBrandMark';
import type { NavItem } from '../config/navigation';
import { NavIcon } from './NavIcon';

interface SidebarProps {
  items: NavItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ items, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { status, label } = useConnectionStatus();
  const { activeCampaign } = useCampaign();
  const { settings: clinicSettings } = useClinicSettings();
  const startNewScreening = useStartNewScreening();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const campaignLabel = activeCampaign
    ? activeCampaign.edition
      ? `${activeCampaign.name} — ${activeCampaign.edition}`
      : activeCampaign.name
    : 'Nicio campanie selectată';

  return (
    <>
      {isOpen && (
        <button
          type="button"
          aria-label="Închide meniul"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <ClinicBrandMark size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {clinicSettings?.branding.app_name ?? 'MedScreen'}
            </p>
            <p className="truncate text-xs text-brand-accent">
              {clinicSettings?.branding.app_subtitle ?? 'Festival Suite'}
            </p>
          </div>
        </div>

        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4" aria-label="Navigare principală">
          <ul className="space-y-1">
            {items.map((item) => {
              const active = isActive(item.path);
              const isScreeningEntry = item.path === '/screening';

              if (isScreeningEntry) {
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        startNewScreening();
                      }}
                      className={`flex min-h-touch w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        active
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary'
                      }`}
                    >
                      <NavIcon icon={item.icon} />
                      <span className="flex-1">{item.label}</span>
                    </button>
                  </li>
                );
              }

              return (
                <li key={item.id}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`flex min-h-touch items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-brand-primary'
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          active ? 'bg-white/20 text-white' : 'bg-brand-accent/10 text-brand-accent'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-200 p-4 space-y-3">
          <ConnectionStatusBadge status={status} label={label} />
          <div className="rounded-xl bg-gradient-to-r from-brand-primary/5 to-brand-accent/10 p-3">
            <p className="text-xs font-medium text-brand-primary">Campanie activă</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{campaignLabel}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
