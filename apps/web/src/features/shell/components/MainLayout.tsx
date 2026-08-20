import { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { shouldHideShellFooter } from '../../screening/config/operator-ui';
import { getNavItemsForRole } from '../config/navigation';
import { AppFooter } from './AppFooter';
import { BreadcrumbNav } from './BreadcrumbNav';
import { Sidebar } from './Sidebar';
import { TopNavBar } from './TopNavBar';

export function MainLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showFooter = !shouldHideShellFooter(location.pathname);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navItems = getNavItemsForRole(user.role);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar items={navItems} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavBar user={user} onMenuToggle={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
            <BreadcrumbNav />
            <Outlet />
          </div>
        </main>
        {showFooter ? <AppFooter /> : null}
      </div>
    </div>
  );
}
