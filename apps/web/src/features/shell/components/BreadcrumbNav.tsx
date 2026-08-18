import { Link, useLocation } from 'react-router-dom';
import { BREADCRUMB_LABELS } from '../config/navigation';

export function BreadcrumbNav() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const crumbs: { label: string; path: string }[] = [
    { label: 'Panou principal', path: '/' },
  ];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const label = BREADCRUMB_LABELS[segment];
    if (label) {
      crumbs.push({ label, path: currentPath });
    }
  }

  if (crumbs.length === 1 && location.pathname === '/') {
    return (
      <nav aria-label="Fir de navigare" className="mb-6">
        <ol className="flex items-center gap-2 text-sm">
          <li className="font-medium text-slate-900">Panou principal</li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Fir de navigare" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-2">
              {index > 0 && <span className="text-slate-300">/</span>}
              {isLast ? (
                <span className="font-medium text-brand-primary">{crumb.label}</span>
              ) : (
                <Link to={crumb.path} className="text-slate-500 transition hover:text-brand-primary">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
