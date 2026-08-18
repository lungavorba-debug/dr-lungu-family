import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AuthUser } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { ROLE_LABELS } from '../config/navigation';

interface UserProfileMenuProps {
  user: AuthUser;
}

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleLogout() {
    setIsOpen(false);
    void logout().finally(() => {
      navigate('/login', { replace: true });
    });
  }

  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-touch items-center gap-3 rounded-xl border border-slate-200 bg-white px-2 py-1.5 pl-1.5 transition hover:border-brand-primary/30 hover:bg-slate-50"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-slate-900">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-brand-accent">{ROLE_LABELS[user.role]}</p>
        </div>
        <svg
          className={`hidden h-4 w-4 text-slate-400 transition sm:block ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-slate-500">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
          <div className="p-1">
            <Link
              to="/profile"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full min-h-touch items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Profil profesional
            </Link>
            <Link
              to="/change-password"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="flex w-full min-h-touch items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Schimbare parolă
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex w-full min-h-touch items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Ieșire din cont
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
