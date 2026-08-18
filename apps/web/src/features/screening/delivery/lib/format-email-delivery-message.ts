import type { DeliverScreeningResponse } from '@medscreen/types';

export function formatEmailDeliveryTimestamp(sentAt: string | null | undefined): string {
  if (!sentAt) {
    return new Intl.DateTimeFormat('ro-RO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date());
  }

  return new Intl.DateTimeFormat('ro-RO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(sentAt));
}

export function formatEmailDeliverySuccessMessage(response: DeliverScreeningResponse): string {
  const timestamp = formatEmailDeliveryTimestamp(response.sent_at);
  const sender = response.sender ?? '—';
  const recipient = response.recipient;

  return [
    '✅ Email trimis cu succes',
    '',
    'Destinatar:',
    recipient,
    '',
    'Expeditor:',
    sender,
    '',
    'Ora:',
    timestamp,
  ].join('\n');
}
