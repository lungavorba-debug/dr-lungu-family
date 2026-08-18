import type { ReactNode } from 'react';

interface DashboardPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function DashboardPageHeader({ title, description, actions }: DashboardPageHeaderProps) {
  return (
    <header className="rounded-2xl border border-brand-primary/15 bg-white p-6 shadow-medical">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {description ? <p className="mt-2 text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}
