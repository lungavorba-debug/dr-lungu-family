import type { ReactNode } from 'react';

type Accent = 'blue' | 'green' | 'amber' | 'slate';

interface DashboardCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  accent?: Accent;
  icon?: ReactNode;
}

const accentStyles: Record<Accent, { border: string; bg: string; text: string }> = {
  blue: {
    border: 'border-brand-primary/20',
    bg: 'bg-brand-primary/5',
    text: 'text-brand-primary',
  },
  green: {
    border: 'border-brand-accent/20',
    bg: 'bg-brand-accent/5',
    text: 'text-brand-accent',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    text: 'text-amber-600',
  },
  slate: {
    border: 'border-slate-200',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
  },
};

export function DashboardCard({ title, value, subtitle, accent = 'blue', icon }: DashboardCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className={`rounded-2xl border ${styles.border} bg-white p-5 shadow-sm transition hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${styles.text}`}>{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.bg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
