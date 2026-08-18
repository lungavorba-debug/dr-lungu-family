import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { RoleName } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { NAV_ITEMS } from '../config/navigation';

interface RoleRouteProps {
  allowedRoles: RoleName[];
  children: ReactNode;
}

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-red-700">Acces interzis</h2>
        <p className="mt-2 text-sm text-red-600">
          Nu aveți permisiunea necesară pentru această secțiune.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-primary px-4 text-sm font-medium text-white"
        >
          Înapoi la panou
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

export function getRouteRoles(path: string): RoleName[] {
  const item = NAV_ITEMS.find((nav) => nav.path === path);
  return item?.roles ?? ['ADMIN', 'OPERATOR', 'MEDIC'];
}
