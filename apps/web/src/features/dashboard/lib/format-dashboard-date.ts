export function formatDashboardDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(isoDate));
}

export function formatDashboardDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';

  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}
