import type { ConnectionStatus } from '../context/ConnectionStatusContext';

interface ConnectionStatusBadgeProps {
  status: ConnectionStatus;
  label: string;
  compact?: boolean;
}

export function ConnectionStatusBadge({ status, label, compact = false }: ConnectionStatusBadgeProps) {
  const isOnline = status === 'online';
  const isChecking = status === 'checking';

  const dotClass = isChecking
    ? 'bg-amber-400 animate-pulse'
    : isOnline
      ? 'bg-brand-accent'
      : 'bg-amber-500';

  const containerClass = isChecking
    ? 'bg-amber-50 text-amber-700'
    : isOnline
      ? 'bg-brand-accent/10 text-brand-accent'
      : 'bg-amber-50 text-amber-700';

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${containerClass} ${
        compact ? 'text-xs' : 'text-xs font-medium'
      }`}
      role="status"
      aria-live="polite"
      aria-label={`Stare conexiune: ${label}`}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} aria-hidden />
      <span>{label}</span>
    </div>
  );
}
