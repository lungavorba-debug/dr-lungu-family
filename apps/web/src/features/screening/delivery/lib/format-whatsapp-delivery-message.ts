import type { DeliverScreeningResponse } from '@medscreen/types';
import { formatEmailDeliveryTimestamp } from './format-email-delivery-message';

export function formatWhatsAppDeliverySuccessMessage(response: DeliverScreeningResponse): string {
  const timestamp = formatEmailDeliveryTimestamp(response.sent_at);
  const recipient = response.recipient;
  const messageId = response.provider_message_id ?? '—';

  return [
    '✅ Raport trimis prin WhatsApp',
    '',
    'Destinatar:',
    recipient,
    '',
    'ID mesaj:',
    messageId,
    '',
    'Ora:',
    timestamp,
  ].join('\n');
}
