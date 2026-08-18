import type { ScreeningDeliveryRecord } from '@medscreen/types';

interface DeliveryHistoryPanelProps {
  deliveries: ScreeningDeliveryRecord[];
  isLoading?: boolean;
}

function formatChannel(channel: ScreeningDeliveryRecord['channel']): string {
  return channel === 'whatsapp' ? 'WhatsApp' : 'Email';
}

function formatStatus(status: ScreeningDeliveryRecord['status']): string {
  if (status === 'sent') return 'Trimis';
  if (status === 'failed') return 'Eșuat';
  return 'În curs';
}

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function DeliveryHistoryPanel({ deliveries, isLoading = false }: DeliveryHistoryPanelProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Istoric livrări">
        <h2 className="text-lg font-semibold text-slate-900">Istoric livrări</h2>
        <p className="mt-2 text-sm text-slate-500">Se încarcă istoricul...</p>
      </section>
    );
  }

  if (deliveries.length === 0) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5" aria-label="Istoric livrări">
      <h2 className="text-lg font-semibold text-slate-900">Istoric livrări</h2>
      <ul className="mt-4 space-y-3">
        {deliveries.map((delivery) => (
          <li
            key={delivery.id}
            className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-900">
                {formatChannel(delivery.channel)} · {delivery.recipient}
              </span>
              <span
                className={
                  delivery.status === 'sent'
                    ? 'rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-xs font-semibold text-brand-accent'
                    : delivery.status === 'failed'
                      ? 'rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800'
                      : 'rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600'
                }
              >
                {formatStatus(delivery.status)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {formatTimestamp(delivery.sent_at ?? delivery.attempted_at)}
            </p>
            {delivery.error_message ? (
              <p className="mt-2 text-xs text-amber-800">{delivery.error_message}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
